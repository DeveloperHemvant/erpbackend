import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { tenantContext } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './current-user.decorator';

describe('JwtAuthGuard.handleRequest — Campus Isolation Phase 2', () => {
  const guard = new JwtAuthGuard(new Reflector());
  const dummyContext = {} as ExecutionContext;

  const runInStore = <T>(fn: () => T): T =>
    tenantContext.run({ ipAddress: '0.0.0.0', userAgent: 'test' }, fn);

  it('writes the JWT-verified campusId into the tenantContext store, not any header value', () => {
    const staffUser: AuthenticatedUser = {
      userId: 'staff-1',
      identifier: 'teacher@school.edu',
      role: 'Teacher',
      permissions: ['VIEW_STUDENTS'],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
    };

    runInStore(() => {
      guard.handleRequest(null, staffUser, null, dummyContext);
      expect(tenantContext.getStore()?.campusId).toBe('campus-a');
    });
  });

  it('a forged/attempted header value has zero effect — nothing in this guard ever reads headers', () => {
    // Simulates the old vulnerability: even if something upstream still set
    // a header-derived campusId in the store before this guard runs, the
    // guard unconditionally overwrites it with the trusted JWT value.
    const staffUser: AuthenticatedUser = {
      userId: 'staff-1',
      identifier: 'teacher@school.edu',
      role: 'Teacher',
      permissions: [],
      campusId: 'campus-real',
      canAccessAllCampuses: false,
    };

    tenantContext.run(
      { ipAddress: '0.0.0.0', userAgent: 'test', campusId: 'campus-forged' },
      () => {
        guard.handleRequest(null, staffUser, null, dummyContext);
        expect(tenantContext.getStore()?.campusId).toBe('campus-real');
        expect(tenantContext.getStore()?.campusId).not.toBe('campus-forged');
      },
    );
  });

  it('a canAccessAllCampuses user gets campusId: undefined (unrestricted), never their own campusId', () => {
    const superAdmin: AuthenticatedUser = {
      userId: 'admin-1',
      identifier: 'admin@school.edu',
      role: 'Super Admin',
      permissions: ['*'],
      campusId: 'campus-a',
      canAccessAllCampuses: true,
    };

    runInStore(() => {
      guard.handleRequest(null, superAdmin, null, dummyContext);
      expect(tenantContext.getStore()?.campusId).toBeUndefined();
    });
  });

  it('a portal (Student/Parent) user with campusId: null leaves the store campusId undefined', () => {
    const studentUser: AuthenticatedUser = {
      userId: 'student-1',
      identifier: 'student01',
      role: 'Student',
      permissions: ['VIEW_OWN_PROFILE'],
      campusId: null,
      canAccessAllCampuses: false,
    };

    runInStore(() => {
      guard.handleRequest(null, studentUser, null, dummyContext);
      expect(tenantContext.getStore()?.campusId).toBeUndefined();
    });
  });

  it('still sets userEmail as before — this fix is additive, not a regression of the existing audit-logging behavior', () => {
    const staffUser: AuthenticatedUser = {
      userId: 'staff-1',
      identifier: 'teacher@school.edu',
      role: 'Teacher',
      permissions: [],
      campusId: 'campus-a',
      canAccessAllCampuses: false,
    };

    runInStore(() => {
      guard.handleRequest(null, staffUser, null, dummyContext);
      expect(tenantContext.getStore()?.userEmail).toBe('teacher@school.edu');
    });
  });
});
