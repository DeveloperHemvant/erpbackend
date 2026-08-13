import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { imageUrlFor } from '../common/image-upload';

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Single shared file-storage client for every feature that needs one
 * (attachments, staff photos, and — once built — certificate/ID-card/report-
 * card PDFs). Real S3-compatible upload when S3_BUCKET/S3_ACCESS_KEY_ID/
 * S3_SECRET_ACCESS_KEY are set (works against AWS S3 or any S3-compatible
 * endpoint like Cloudflare R2/MinIO via S3_ENDPOINT); otherwise falls back to
 * a real local-disk write under backend/uploads/ — already served statically
 * by main.ts's useStaticAssets() — so uploads work end-to-end in every
 * environment, not just once cloud credentials exist. Mirrors the
 * configured/not_configured fallback pattern already proven for Razorpay in
 * fees.service.ts.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucket: string | null = null;
  private readonly publicBaseUrl: string | null = null;

  constructor() {
    const {
      S3_BUCKET,
      S3_REGION,
      S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY,
      S3_ENDPOINT,
      S3_PUBLIC_BASE_URL,
    } = process.env;

    if (S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) {
      this.bucket = S3_BUCKET;
      this.publicBaseUrl = S3_PUBLIC_BASE_URL || null;
      this.s3Client = new S3Client({
        region: S3_REGION || 'auto',
        endpoint: S3_ENDPOINT || undefined,
        forcePathStyle: !!S3_ENDPOINT,
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID,
          secretAccessKey: S3_SECRET_ACCESS_KEY,
        },
      });
    } else {
      this.logger.warn(
        'S3 storage not configured (set S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY to enable it) — uploads will be written to local disk under backend/uploads/ instead.',
      );
    }
  }

  get isConfigured(): boolean {
    return !!this.s3Client;
  }

  async uploadFile(
    buffer: Buffer,
    keyPrefix: string,
    originalName: string,
    contentType?: string,
  ): Promise<UploadResult> {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${randomUUID()}-${safeName}`;
    const key = `${keyPrefix}/${filename}`;

    if (this.s3Client && this.bucket) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      const url = this.publicBaseUrl
        ? `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`
        : `https://${this.bucket}.s3.amazonaws.com/${key}`;
      return { url, key };
    }

    const localDir = path.join(process.cwd(), 'uploads', keyPrefix);
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, filename), buffer);
    return { url: imageUrlFor(keyPrefix, filename), key };
  }

  async deleteFile(key: string): Promise<void> {
    if (this.s3Client && this.bucket) {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return;
    }
    const localPath = path.join(process.cwd(), 'uploads', key);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
}
