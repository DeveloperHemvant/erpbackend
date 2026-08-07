import { Logger } from '@nestjs/common';
import { SimulationApiClient } from './api-client';
import * as fs from 'fs';
import * as path from 'path';

export interface SimulationReport {
  apiHealth: {
    totalCalls: number;
    success: number;
    failed: number;
  };
  failures: Array<{
    endpoint: string;
    status: number;
    reason: string;
  }>;
  performance: Record<string, { p95: number }>;
}

export class EsseRunner {
  private readonly logger = new Logger(EsseRunner.name);
  private readonly client: SimulationApiClient;
  private readonly report: SimulationReport = {
    apiHealth: { totalCalls: 0, success: 0, failed: 0 },
    failures: [],
    performance: {},
  };

  constructor(port = 8000) {
    this.client = new SimulationApiClient(port);
  }

  private trackRequest(endpoint: string, status: number, duration: number, errorReason = '') {
    this.report.apiHealth.totalCalls++;
    if (status >= 200 && status < 300) {
      this.report.apiHealth.success++;
    } else {
      this.report.apiHealth.failed++;
      this.report.failures.push({
        endpoint,
        status,
        reason: errorReason || `HTTP ${status}`,
      });
    }

    if (!this.report.performance[endpoint]) {
      this.report.performance[endpoint] = { p95: duration };
    } else {
      this.report.performance[endpoint].p95 = Math.round(
        (this.report.performance[endpoint].p95 * 0.9) + (duration * 0.1)
      );
    }
  }

  async runSimulation(days = 1): Promise<SimulationReport> {
    this.logger.log(`Starting Enterprise School Simulation Engine for ${days} days...`);

    // Log in as Super Admin to perform bootstrap operations
    const loggedIn = await this.client.login('superadmin@centralacademy.edu', 'Admin@123');
    if (!loggedIn) {
      this.logger.error('Failed to log in superadmin. Aborting simulation.');
      return this.report;
    }

    // Phase 1: Bootstrap School Profile
    const t0 = Date.now();
    const bootstrapRes = await this.client.post('/school-profile', {
      name: 'ESSE Simulated Trust',
      email: 'trust@esse-simulation.org',
    });
    this.trackRequest('/school-profile', bootstrapRes.status, Date.now() - t0, JSON.stringify(bootstrapRes.data));

    // Phase 3 & 4: Daily Cron Loop
    for (let day = 1; day <= days; day++) {
      this.logger.log(`Simulating Day ${day}...`);

      // Teacher daily actions (Attendance & Homework)
      const t1 = Date.now();
      const attRes = await this.client.post('/erp-core/attendance', {
        sectionId: 'test-section',
        students: [{ studentId: 'student-1', status: 'PRESENT' }],
      });
      this.trackRequest('/erp-core/attendance', attRes.status, Date.now() - t1, JSON.stringify(attRes.data));

      // Student/Parent operations (Log in & Query details)
      const t2 = Date.now();
      const studRes = await this.client.get('/students');
      this.trackRequest('/students', studRes.status, Date.now() - t2, JSON.stringify(studRes.data));

      // Chaos Inject: Random late payment or absence
      if (Math.random() < 0.2) {
        this.logger.log('Chaos Inject: Simulating teacher absence substitution...');
        const t3 = Date.now();
        const substRes = await this.client.post('/substitution/logs', {
          absentTeacherId: 'teacher-1',
          substituteTeacherId: 'teacher-2',
        });
        this.trackRequest('/substitution/logs', substRes.status, Date.now() - t3, JSON.stringify(substRes.data));
      }
    }

    this.logger.log('Simulation complete. Generating report outputs...');
    this.writeOutputs();
    return this.report;
  }

  private writeOutputs() {
    const outputDir = path.join(process.cwd(), 'graphify-out');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'esse-report.json'),
      JSON.stringify(this.report, null, 2)
    );

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>ESSE Simulation Run Report</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f1f5f9; padding: 2rem; }
    h1 { color: #38bdf8; }
    .card { background: #1e293b; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
    .metric { font-size: 2rem; font-weight: bold; color: #10b981; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border-bottom: 1px solid #334155; padding: 0.75rem; text-align: left; }
    th { color: #94a3b8; }
  </style>
</head>
<body>
  <h1>ESSE Simulation Summary</h1>
  <div class="card">
    <h2>API Health</h2>
    <div>Total Calls: <span class="metric">${this.report.apiHealth.totalCalls}</span></div>
    <div>Success: ${this.report.apiHealth.success}</div>
    <div>Failed: ${this.report.apiHealth.failed}</div>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(path.join(outputDir, 'esse-report.html'), htmlContent);
  }
}
