import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockRepo = {
    countStudentAttendance: jest.fn(),
    countStaffAttendance: jest.fn(),
    countLateEntries: jest.fn(),
    countCurrentVisitors: jest.fn(),
    countPendingVisitorApprovals: jest.fn(),
    sumFeePaymentsForDate: jest.fn(),
    countActiveTripsToday: jest.fn(),
    countActiveVehicles: jest.fn(),
    countOpenBreakdowns: jest.fn(),
    countPendingLeaveApplications: jest.fn(),
    countRequestedRefunds: jest.fn(),
    countPendingAdmissions: jest.fn(),
    countOpenDisciplineCases: jest.fn(),
    countEnrolledStudents: jest.fn(),
    countActiveStaff: jest.fn(),
    findInvoiceFinancials: jest.fn(),
    findClassRevenueBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: AnalyticsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getDashboardSummary', () => {
    it('computes student and staff attendance rates independently', async () => {
      mockRepo.countStudentAttendance.mockImplementation(
        (_date: string, status?: string) => {
          if (!status) return Promise.resolve(200);
          if (status === 'Present') return Promise.resolve(180);
          return Promise.resolve(10); // Absent
        },
      );
      mockRepo.countStaffAttendance.mockImplementation(
        (_date: string, status?: string) => {
          if (!status) return Promise.resolve(50);
          if (status === 'Present') return Promise.resolve(45);
          return Promise.resolve(2);
        },
      );
      mockRepo.countLateEntries.mockResolvedValue(3);
      mockRepo.countCurrentVisitors.mockResolvedValue(4);
      mockRepo.countPendingVisitorApprovals.mockResolvedValue(1);
      mockRepo.sumFeePaymentsForDate.mockResolvedValue(15000);
      mockRepo.countActiveTripsToday.mockResolvedValue(8);
      mockRepo.countActiveVehicles.mockResolvedValue(10);
      mockRepo.countOpenBreakdowns.mockResolvedValue(1);
      mockRepo.countPendingLeaveApplications.mockResolvedValue(5);
      mockRepo.countRequestedRefunds.mockResolvedValue(2);
      mockRepo.countPendingAdmissions.mockResolvedValue(9);
      mockRepo.countOpenDisciplineCases.mockResolvedValue(3);
      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 900000, totalAmount: null, status: 'Paid', dueDate: '2026-01-01' },
        { amount: 100000, totalAmount: null, status: 'Unpaid', dueDate: '2026-01-01' },
      ]);
      mockRepo.countActiveStaff.mockResolvedValue(214);
      mockRepo.countEnrolledStudents.mockResolvedValue(5011);

      const result = await service.getDashboardSummary();

      expect(result.attendanceRate).toBe(90); // 180/200
      expect(result.staffAttendanceRate).toBe(90); // 45/50
      expect(result.studentsPresent).toBe(180);
      expect(result.staffPresent).toBe(45);
      expect(result.totalOutstanding).toBe(100000); // 1,000,000 - 900,000
      expect(result.busesRunning).toBe(8);
      expect(result.busesTotal).toBe(10);
    });

    it('returns 0% attendance rather than dividing by zero when nothing is marked yet', async () => {
      mockRepo.countStudentAttendance.mockResolvedValue(0);
      mockRepo.countStaffAttendance.mockResolvedValue(0);
      mockRepo.countLateEntries.mockResolvedValue(0);
      mockRepo.countCurrentVisitors.mockResolvedValue(0);
      mockRepo.countPendingVisitorApprovals.mockResolvedValue(0);
      mockRepo.sumFeePaymentsForDate.mockResolvedValue(0);
      mockRepo.countActiveTripsToday.mockResolvedValue(0);
      mockRepo.countActiveVehicles.mockResolvedValue(0);
      mockRepo.countOpenBreakdowns.mockResolvedValue(0);
      mockRepo.countPendingLeaveApplications.mockResolvedValue(0);
      mockRepo.countRequestedRefunds.mockResolvedValue(0);
      mockRepo.countPendingAdmissions.mockResolvedValue(0);
      mockRepo.countOpenDisciplineCases.mockResolvedValue(0);
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      mockRepo.countActiveStaff.mockResolvedValue(0);
      mockRepo.countEnrolledStudents.mockResolvedValue(0);

      const result = await service.getDashboardSummary();

      expect(result.attendanceRate).toBe(0);
      expect(result.staffAttendanceRate).toBe(0);
      expect(result.totalOutstanding).toBe(0);
    });
  });

  describe('getHealthScore', () => {
    beforeEach(() => {
      // Attendance: 180/200 = 90%
      mockRepo.countStudentAttendance.mockImplementation(
        (_d: string, status?: string) => {
          if (!status) return Promise.resolve(200);
          if (status === 'Present') return Promise.resolve(180);
          return Promise.resolve(20);
        },
      );
      // Transport: 8/10 = 80%
      mockRepo.countActiveTripsToday.mockResolvedValue(8);
      mockRepo.countActiveVehicles.mockResolvedValue(10);
      // Discipline: 2 open cases / 1000 enrolled -> penalty 2 * 15 = 30 -> 70
      mockRepo.countOpenDisciplineCases.mockResolvedValue(2);
      mockRepo.countEnrolledStudents.mockResolvedValue(1000);
      // Finance: 900k / 1,000,000 = 90%
      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 900000, totalAmount: null, status: 'Paid', dueDate: '2026-01-01' },
        { amount: 100000, totalAmount: null, status: 'Unpaid', dueDate: '2026-01-01' },
      ]);
    });

    it('marks academics, parentEngagement, and infrastructure as null — never fabricated', async () => {
      const result = await service.getHealthScore();
      expect(result.categories.academics).toBeNull();
      expect(result.categories.parentEngagement).toBeNull();
      expect(result.categories.infrastructure).toBeNull();
    });

    it('computes the 4 measurable category sub-scores correctly', async () => {
      const result = await service.getHealthScore();
      expect(result.categories.attendance).toBe(90);
      expect(result.categories.transport).toBe(80);
      expect(result.categories.discipline).toBe(70);
      expect(result.categories.finance).toBe(90);
    });

    it('reports coverage as 4 of 7 and caps score at the measurable weight, never redistributing', async () => {
      const result = await service.getHealthScore();
      expect(result.coverage).toEqual({
        measurable: 4,
        total: 7,
        label: '4 of 7 categories measurable',
      });
      // weights: attendance 20, finance 15, transport 10, discipline 10 = 55 max
      expect(result.maxPossibleScore).toBe(55);
      // weighted sum = 20*90 + 15*90 + 10*80 + 10*70 = 1800+1350+800+700 = 4650
      // score = round(4650 / 100) = 47 (against the FULL 100-point base, not 55)
      expect(result.score).toBe(47);
      expect(result.score).toBeLessThanOrEqual(result.maxPossibleScore);
    });

    it('never lets a measurable category score exceed 100 from inflating the total', async () => {
      const result = await service.getHealthScore();
      const weights = result.weights;
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(totalWeight).toBe(100);
    });

    it('scores transport as null instead of dividing by zero when there is no active fleet', async () => {
      mockRepo.countActiveVehicles.mockResolvedValue(0);
      const result = await service.getHealthScore();
      expect(result.categories.transport).toBeNull();
      expect(result.coverage.measurable).toBe(3);
    });

    it('scores discipline as null instead of dividing by zero when there are no enrolled students', async () => {
      mockRepo.countEnrolledStudents.mockResolvedValue(0);
      const result = await service.getHealthScore();
      expect(result.categories.discipline).toBeNull();
    });

    it('scores finance as null instead of dividing by zero when nothing has been invoiced', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([]);
      const result = await service.getHealthScore();
      expect(result.categories.finance).toBeNull();
    });

    it('prefers totalAmount (late fees included) over amount when computing invoice totals', async () => {
      mockRepo.findInvoiceFinancials.mockResolvedValue([
        { amount: 1000, totalAmount: 1200, status: 'Paid', dueDate: '2026-01-01' }, // late fee applied
        { amount: 500, totalAmount: null, status: 'Unpaid', dueDate: '2026-01-01' },
      ]);
      const result = await service.getHealthScore();
      // collected 1200 / invoiced (1200 + 500) = 70.58...% -> 71
      expect(result.categories.finance).toBe(71);
    });

    it('floors the discipline penalty at 0 rather than going negative', async () => {
      // 100 open cases / 1000 enrolled = way past the 100-point penalty budget
      mockRepo.countOpenDisciplineCases.mockResolvedValue(100);
      const result = await service.getHealthScore();
      expect(result.categories.discipline).toBe(0);
    });
  });

  describe('getTrends', () => {
    it('sums revenue by class from the invoice breakdown, split by paid/unpaid', async () => {
      mockRepo.findClassRevenueBreakdown.mockResolvedValue([
        {
          grade: 'Grade 5',
          sections: [
            {
              enrollments: [
                {
                  invoices: [
                    { status: 'Paid', amount: 5000 },
                    { status: 'Unpaid', amount: 2000 },
                  ],
                },
              ],
            },
          ],
        },
      ]);
      mockRepo.countStudentAttendance.mockResolvedValue(0);

      const result = await service.getTrends();

      expect(result.revenueByClass).toEqual([
        { name: 'Grade 5', collected: 5000, outstanding: 2000 },
      ]);
      expect(result.attendanceTrend).toHaveLength(7);
    });
  });
});
