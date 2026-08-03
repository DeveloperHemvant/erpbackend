import { SetMetadata } from "@nestjs/common";

export interface SelfOrPermissionConfig {
  paramName: string;
  permissions: string[];
}

export const SELF_OR_PERMISSION_KEY = "selfOrPermissionConfig";

/** Allow the route when the URL param equals the caller's own id, OR the
 * caller holds one of the given permissions — for routes that serve both
 * "view my own record" and "admin views any record" from the same handler. */
export const RequireSelfOrPermission = (paramName: string, ...permissions: string[]) =>
  SetMetadata(SELF_OR_PERMISSION_KEY, { paramName, permissions });
