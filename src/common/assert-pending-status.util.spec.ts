import { BadRequestException } from '@nestjs/common';
import { assertPendingStatus } from './assert-pending-status.util';

describe('assertPendingStatus', () => {
  it('does not throw when the current status matches the expected pending status', () => {
    expect(() =>
      assertPendingStatus('Pending', 'Pending', 'fuel logs'),
    ).not.toThrow();
  });

  it('throws a BadRequestException with the current status in the message when it does not match', () => {
    expect(() => assertPendingStatus('Approved', 'Pending', 'fuel logs')).toThrow(
      new BadRequestException(
        'Only pending fuel logs can be resolved (current status: Approved).',
      ),
    );
  });

  it('supports a differently-named pending state (e.g. fee refunds use "Requested")', () => {
    expect(() =>
      assertPendingStatus('Rejected', 'Requested', 'requests'),
    ).toThrow(
      new BadRequestException(
        'Only pending requests can be resolved (current status: Rejected).',
      ),
    );
  });
});
