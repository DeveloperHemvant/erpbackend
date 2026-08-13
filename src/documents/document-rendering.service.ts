import { Injectable, Logger } from '@nestjs/common';
import * as React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import * as fs from 'fs';
import * as path from 'path';

const SCHOOL_NAME = 'Aetheria Academy';

/**
 * Single shared PDF renderer for every document type (certificates, report
 * cards, ID cards, payslips) — Phase 4. Uses @react-pdf/renderer without
 * JSX (this package has no @types/react and this backend has no jsx
 * compiler option configured — React.createElement avoids touching either).
 * Output is a Buffer; callers upload it via StorageService, same as any
 * other attachment.
 */
@Injectable()
export class DocumentRenderingService {
  private readonly logger = new Logger(DocumentRenderingService.name);
  private readonly h = React.createElement;

  /** Reads a local /uploads/... path straight off disk, or fetches a remote
   * URL over HTTP — either way returns image bytes react-pdf's <Image> can
   * embed directly, or undefined if the source is missing/unreachable. */
  private async resolveImageSource(
    url: string | null | undefined,
  ): Promise<Buffer | undefined> {
    if (!url) return undefined;
    try {
      if (url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), url);
        if (!fs.existsSync(localPath)) return undefined;
        return fs.readFileSync(localPath);
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const res = await fetch(url);
        if (!res.ok) return undefined;
        return Buffer.from(await res.arrayBuffer());
      }
      return undefined;
    } catch (err) {
      this.logger.warn(`Could not resolve image source "${url}": ${err}`);
      return undefined;
    }
  }

  private resolveToken(key: string, ctx: Record<string, any>): string {
    const token = String(key || '').replace(/[[\]]/g, '').trim().toUpperCase();
    const map: Record<string, any> = {
      FULL_NAME: ctx.fullName,
      NAME: ctx.fullName,
      ROLE: ctx.role,
      ADMISSION_NUMBER: ctx.admissionNumber,
      TITLE: ctx.title,
      TYPE: ctx.type,
      DATE: ctx.date,
      ISSUE_DATE: ctx.date,
      SCHOOL_NAME: ctx.schoolName || SCHOOL_NAME,
    };
    const value = map[token];
    return value !== undefined && value !== null ? String(value) : '';
  }

  /** designJson.fields -> positioned <Text>/<Image> elements, resolving any
   * [PHOTO] field's image bytes first since that step is async. */
  private async resolveFieldElements(
    fields: any[],
    ctx: Record<string, any>,
  ): Promise<any[]> {
    const elements: any[] = [];
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i] || {};
      if (field.key === '[PHOTO]') {
        const photoSrc = await this.resolveImageSource(ctx.photoUrl);
        if (photoSrc) {
          elements.push(
            this.h(Image, {
              key: i,
              src: photoSrc,
              style: {
                position: 'absolute',
                left: field.x || 0,
                top: field.y || 0,
                width: field.width || 80,
                height: field.height || 100,
              },
            }),
          );
        }
        continue;
      }
      elements.push(
        this.h(
          Text,
          {
            key: i,
            style: {
              position: 'absolute',
              left: field.x || 0,
              top: field.y || 0,
              fontSize: field.fontSize || 12,
              color: field.color || '#000000',
              fontWeight: field.fontWeight || 'normal',
            },
          },
          this.resolveToken(field.key, ctx),
        ),
      );
    }
    return elements;
  }

  /** ctx: {fullName, role, admissionNumber, photoUrl, title, type, date} —
   * caller assembles this from whichever target (student/staff) the
   * certificate/ID card is for; see template.service.ts / idcard.service.ts. */
  async renderCertificate(
    template: { designJson?: any },
    ctx: Record<string, any>,
  ): Promise<Buffer> {
    const designJson = template.designJson || {};
    const fields = designJson.fields || [];
    const [backgroundSrc, fieldElements] = await Promise.all([
      this.resolveImageSource(designJson.backgroundUrl),
      this.resolveFieldElements(fields, ctx),
    ]);

    const styles = StyleSheet.create({
      page: { position: 'relative', backgroundColor: '#ffffff' },
      background: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
    });

    const children: any[] = [];
    if (backgroundSrc) children.push(this.h(Image, { key: 'bg', src: backgroundSrc, style: styles.background }));
    children.push(...fieldElements);

    const doc = this.h(
      Document,
      null,
      this.h(Page, { size: 'A4', orientation: 'landscape', style: styles.page }, ...children),
    );
    return renderToBuffer(doc);
  }

  async renderIdCard(
    template: {
      schoolName?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      logoUrl?: string | null;
    },
    ctx: {
      fullName: string;
      role: string;
      idNumber: string;
      photoUrl?: string | null;
      expiryDate?: string;
    },
  ): Promise<Buffer> {
    const [photoSrc, logoSrc] = await Promise.all([
      this.resolveImageSource(ctx.photoUrl),
      this.resolveImageSource(template.logoUrl),
    ]);
    const primary = template.primaryColor || '#3b82f6';
    const secondary = template.secondaryColor || '#1e40af';

    const styles = StyleSheet.create({
      page: { padding: 0 },
      card: {
        width: 340,
        height: 214,
        backgroundColor: '#ffffff',
        border: '1px solid #d0d0d0',
        position: 'relative',
      },
      header: {
        backgroundColor: primary,
        height: 46,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
      },
      headerText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
      body: { flexDirection: 'row', padding: 14, gap: 12 },
      photo: { width: 70, height: 84, backgroundColor: '#e5e7eb', border: '1px solid #d0d0d0' },
      infoCol: { flex: 1 },
      name: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
      role: { fontSize: 9, color: secondary, marginBottom: 8, textTransform: 'uppercase' },
      idNumber: { fontSize: 10, color: '#374151', marginBottom: 2 },
      footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: secondary,
        height: 8,
      },
    });

    const doc = this.h(
      Document,
      null,
      this.h(
        Page,
        { size: [340, 214], style: styles.page },
        this.h(
          View,
          { style: styles.card },
          this.h(
            View,
            { style: styles.header },
            logoSrc ? this.h(Image, { src: logoSrc, style: { width: 24, height: 24, marginRight: 8 } }) : null,
            this.h(Text, { style: styles.headerText }, template.schoolName || SCHOOL_NAME),
          ),
          this.h(
            View,
            { style: styles.body },
            photoSrc
              ? this.h(Image, { src: photoSrc, style: styles.photo })
              : this.h(View, { style: styles.photo }),
            this.h(
              View,
              { style: styles.infoCol },
              this.h(Text, { style: styles.name }, ctx.fullName),
              this.h(Text, { style: styles.role }, ctx.role),
              this.h(Text, { style: styles.idNumber }, `ID: ${ctx.idNumber}`),
              ctx.expiryDate
                ? this.h(Text, { style: styles.idNumber }, `Valid until: ${ctx.expiryDate}`)
                : null,
            ),
          ),
          this.h(View, { style: styles.footer }),
        ),
      ),
    );
    return renderToBuffer(doc);
  }

  async renderReportCard(
    reportCard: {
      gpa: string;
      attendanceRate: string;
      remarks?: string | null;
      isApproved: boolean;
      computedData?: any;
    },
    ctx: {
      studentName: string;
      admissionNumber: string;
      className: string;
      examName: string;
    },
  ): Promise<Buffer> {
    const subjects: any[] = reportCard.computedData?.subjects || [];
    const percentage = reportCard.computedData?.percentage;

    const styles = StyleSheet.create({
      page: { padding: 36, fontSize: 10 },
      title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
      subtitle: { fontSize: 11, textAlign: 'center', color: '#555555', marginBottom: 20 },
      infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
      infoLabel: { color: '#555555' },
      infoValue: { fontWeight: 'bold' },
      table: { marginTop: 16, border: '1px solid #cccccc' },
      tableRow: { flexDirection: 'row', borderBottom: '1px solid #eeeeee' },
      tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottom: '1px solid #cccccc' },
      cell: { flex: 1, padding: 6 },
      cellHeader: { flex: 1, padding: 6, fontWeight: 'bold' },
      summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
      remarks: { marginTop: 16 },
      seal: {
        marginTop: 24,
        alignSelf: 'flex-end',
        border: '2px solid #16a34a',
        color: '#16a34a',
        padding: 8,
        fontSize: 11,
        fontWeight: 'bold',
        transform: 'rotate(-8deg)',
      },
    });

    const rows = subjects.map((s, i) =>
      this.h(
        View,
        { key: i, style: styles.tableRow },
        this.h(Text, { style: styles.cell }, s.subject || '—'),
        this.h(Text, { style: styles.cell }, s.isAbsent ? 'Absent' : String(s.marksObtained ?? '—')),
      ),
    );

    const doc = this.h(
      Document,
      null,
      this.h(
        Page,
        { size: 'A4', style: styles.page },
        this.h(Text, { style: styles.title }, SCHOOL_NAME),
        this.h(Text, { style: styles.subtitle }, `Report Card — ${ctx.examName}`),
        this.h(
          View,
          null,
          this.h(
            View,
            { style: styles.infoRow },
            this.h(Text, { style: styles.infoLabel }, 'Student'),
            this.h(Text, { style: styles.infoValue }, ctx.studentName),
          ),
          this.h(
            View,
            { style: styles.infoRow },
            this.h(Text, { style: styles.infoLabel }, 'Admission No.'),
            this.h(Text, { style: styles.infoValue }, ctx.admissionNumber),
          ),
          this.h(
            View,
            { style: styles.infoRow },
            this.h(Text, { style: styles.infoLabel }, 'Class'),
            this.h(Text, { style: styles.infoValue }, ctx.className),
          ),
          this.h(
            View,
            { style: styles.infoRow },
            this.h(Text, { style: styles.infoLabel }, 'Attendance'),
            this.h(Text, { style: styles.infoValue }, reportCard.attendanceRate),
          ),
        ),
        this.h(
          View,
          { style: styles.table },
          this.h(
            View,
            { style: styles.tableHeaderRow },
            this.h(Text, { style: styles.cellHeader }, 'Subject'),
            this.h(Text, { style: styles.cellHeader }, 'Marks'),
          ),
          ...rows,
        ),
        this.h(
          View,
          { style: styles.summaryRow },
          this.h(Text, null, `Percentage: ${percentage ?? '—'}%`),
          this.h(Text, null, `GPA: ${reportCard.gpa}`),
        ),
        reportCard.remarks
          ? this.h(Text, { style: styles.remarks }, `Remarks: ${reportCard.remarks}`)
          : null,
        reportCard.isApproved
          ? this.h(Text, { style: styles.seal }, 'PRINCIPAL APPROVED')
          : null,
      ),
    );
    return renderToBuffer(doc);
  }

  async renderPayslip(
    payslip: {
      month: number;
      year: number;
      basicSalary: number;
      allowances: number;
      fixedDeductions: number;
      lopDeductions: number;
      netSalary: number;
    },
    ctx: { staffName: string; role: string },
  ): Promise<Buffer> {
    const monthName = new Date(payslip.year, payslip.month - 1, 1).toLocaleString('en-US', { month: 'long' });
    const grossEarnings = payslip.basicSalary + payslip.allowances;
    const totalDeductions = payslip.fixedDeductions + payslip.lopDeductions;

    const styles = StyleSheet.create({
      page: { padding: 36, fontSize: 10 },
      title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
      subtitle: { fontSize: 11, textAlign: 'center', color: '#555555', marginBottom: 20 },
      infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
      infoLabel: { color: '#555555' },
      infoValue: { fontWeight: 'bold' },
      columns: { flexDirection: 'row', marginTop: 20, gap: 20 },
      column: { flex: 1, border: '1px solid #cccccc' },
      columnHeader: { backgroundColor: '#f3f4f6', padding: 6, fontWeight: 'bold', borderBottom: '1px solid #cccccc' },
      lineRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid #eeeeee' },
      totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 10, borderTop: '2px solid #111827' },
      totalLabel: { fontSize: 12, fontWeight: 'bold' },
      totalValue: { fontSize: 14, fontWeight: 'bold' },
    });

    const doc = this.h(
      Document,
      null,
      this.h(
        Page,
        { size: 'A4', style: styles.page },
        this.h(Text, { style: styles.title }, SCHOOL_NAME),
        this.h(Text, { style: styles.subtitle }, `Payslip — ${monthName} ${payslip.year}`),
        this.h(
          View,
          null,
          this.h(
            View,
            { style: styles.infoRow },
            this.h(Text, { style: styles.infoLabel }, 'Staff'),
            this.h(Text, { style: styles.infoValue }, ctx.staffName),
          ),
          this.h(
            View,
            { style: styles.infoRow },
            this.h(Text, { style: styles.infoLabel }, 'Role'),
            this.h(Text, { style: styles.infoValue }, ctx.role),
          ),
        ),
        this.h(
          View,
          { style: styles.columns },
          this.h(
            View,
            { style: styles.column },
            this.h(Text, { style: styles.columnHeader }, 'Earnings'),
            this.h(
              View,
              { style: styles.lineRow },
              this.h(Text, null, 'Basic Salary'),
              this.h(Text, null, payslip.basicSalary.toFixed(2)),
            ),
            this.h(
              View,
              { style: styles.lineRow },
              this.h(Text, null, 'Allowances'),
              this.h(Text, null, payslip.allowances.toFixed(2)),
            ),
          ),
          this.h(
            View,
            { style: styles.column },
            this.h(Text, { style: styles.columnHeader }, 'Deductions'),
            this.h(
              View,
              { style: styles.lineRow },
              this.h(Text, null, 'Fixed Deductions'),
              this.h(Text, null, payslip.fixedDeductions.toFixed(2)),
            ),
            this.h(
              View,
              { style: styles.lineRow },
              this.h(Text, null, 'Loss of Pay'),
              this.h(Text, null, payslip.lopDeductions.toFixed(2)),
            ),
          ),
        ),
        this.h(
          View,
          { style: styles.totalRow },
          this.h(Text, { style: styles.totalLabel }, `Gross: ${grossEarnings.toFixed(2)}  •  Deductions: ${totalDeductions.toFixed(2)}`),
          this.h(Text, { style: styles.totalValue }, `Net Pay: ${payslip.netSalary.toFixed(2)}`),
        ),
      ),
    );
    return renderToBuffer(doc);
  }
}
