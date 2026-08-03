import { SetMetadata } from "@nestjs/common";

export const ANY_PERMISSION_KEY = "anyPermissionList";

/** Allow the route when the caller holds AT LEAST ONE of the given permissions
 * (OR semantics) — for routes shared by different roles under different grants,
 * where @RequirePermissions' AND-only check can't express "either/or". */
export const RequireAnyPermission = (...permissions: string[]) => SetMetadata(ANY_PERMISSION_KEY, permissions);
