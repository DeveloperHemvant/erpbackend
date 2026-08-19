import { BadRequestException } from '@nestjs/common';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import * as fs from 'fs';

const UPLOAD_ROOT = 'uploads';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DOCUMENT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

function makeUploadOptions(
  subfolder: string,
  allowedExtensions: string[],
  maxSizeBytes: number,
) {
  const uploadDir = join(process.cwd(), UPLOAD_ROOT, subfolder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: uploadDir,
      filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
      ) => {
        const ext = extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, unique);
      },
    }),
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, accept: boolean) => void,
    ) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        cb(
          new BadRequestException(
            `Unsupported file type "${ext}". Allowed: ${allowedExtensions.join(', ')}`,
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
    limits: { fileSize: maxSizeBytes },
  };
}

/**
 * Real disk-backed multer config for a given subfolder (e.g. "events",
 * "announcements") — replaces the mock-URL pattern used elsewhere in this
 * codebase (staff.controller.ts, attachments.service.ts) with an actual
 * bytes-on-disk store, served back via app.useStaticAssets() in main.ts.
 */
export function imageUploadOptions(subfolder: string) {
  return makeUploadOptions(subfolder, IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_BYTES);
}

/** Same as imageUploadOptions but also allows PDFs — for content uploads
 * (e.g. LMS resources) where course material is often a PDF, not an image. */
export function fileUploadOptions(subfolder: string) {
  return makeUploadOptions(subfolder, DOCUMENT_EXTENSIONS, MAX_FILE_SIZE_BYTES);
}

export function imageUrlFor(subfolder: string, filename: string): string {
  return `/${UPLOAD_ROOT}/${subfolder}/${filename}`;
}
