import { IsString, IsNotEmpty, IsUUID, IsIn } from 'class-validator';

export class RegisterPushTokenDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsIn(['STAFF', 'PARENT', 'STUDENT'])
  @IsNotEmpty()
  userType: 'STAFF' | 'PARENT' | 'STUDENT';

  @IsString()
  @IsNotEmpty()
  token: string;
}
