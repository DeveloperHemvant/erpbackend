import { BadRequestException } from '@nestjs/common';

/**
 * The one check `resolveRefund` (fees), `resolveFuelLog` and `resolveExpense`
 * (transport) all duplicated independently: an approve/reject action is only
 * valid while the record is still in its pending state. Extracted so a third
 * module reaching for the same "resolve" shape has somewhere to reuse it
 * instead of writing a fourth copy — deliberately narrow (just the guard,
 * not the differing field-mapping each caller applies afterward), since
 * those callers use different field names (`remarks`/`referenceNo` vs
 * `rejectionReason`) that don't unify safely into one generic function.
 */
export function assertPendingStatus(
  currentStatus: string,
  expectedPending: string,
  entityLabel: string,
): void {
  if (currentStatus !== expectedPending) {
    throw new BadRequestException(
      `Only pending ${entityLabel} can be resolved (current status: ${currentStatus}).`,
    );
  }
}
