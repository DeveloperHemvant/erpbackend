import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import * as os from 'os';

@Injectable()
export class MonitoringService {
  private previousCpuTimes: { idle: number; total: number } | null = null;
  private currentCpuUsage: number = 0;

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {
    // Periodically calculate CPU usage (works on Windows & Linux)
    setInterval(() => this.calculateCpuUsage(), 2000);
  }

  private calculateCpuUsage() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type as keyof typeof cpu.times];
      }
      idle += cpu.times.idle;
    }

    if (this.previousCpuTimes) {
      const idleDifference = idle - this.previousCpuTimes.idle;
      const totalDifference = total - this.previousCpuTimes.total;

      const percentageCpu = 100 - (100 * idleDifference) / totalDifference;
      this.currentCpuUsage = percentageCpu;
    }

    this.previousCpuTimes = { idle, total };
  }

  async getSystemMetrics() {
    // Basic OS stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;
    const cpuLoad = os.loadavg();
    const cpuCount = os.cpus().length;
    // Use dynamically calculated rolling CPU percentage
    const cpuLoadPercent = this.currentCpuUsage;

    const uptimeSeconds = os.uptime();

    // Node process stats
    const memoryUsage = process.memoryUsage();

    // DB Health Check
    let dbStatus = 'healthy';
    let dbPing = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbPing = Date.now() - start;
    } catch {
      dbStatus = 'offline';
    }

    return {
      status: dbStatus === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      os: {
        platform: os.platform(),
        release: os.release(),
        uptime: uptimeSeconds,
        nodeVersion: process.version,
      },
      cpu: {
        cores: cpuCount,
        loadAvg: cpuLoad,
        utilizationPercent: Math.round(cpuLoadPercent * 100) / 100,
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        utilizationPercent: Math.round(memUsagePercent * 100) / 100,
      },
      process: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
      },
      database: {
        status: dbStatus,
        pingMs: dbPing,
      },
    };
  }

  async getQueueStatus() {
    return this.jobsService.getQueueStatus();
  }
}
