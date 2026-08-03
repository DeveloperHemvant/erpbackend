import { SetMetadata } from "@nestjs/common";

export const STUDENT_ACCESS_PARAM_KEY = "studentAccessParam";
export const RequireStudentAccess = (paramName: string) => SetMetadata(STUDENT_ACCESS_PARAM_KEY, paramName);
