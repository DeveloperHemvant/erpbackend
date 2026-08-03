import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsIn(["ALL", "PARENTS", "STUDENTS", "STAFF"])
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  eventDate?: string;
}

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderType: string;

  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class InitConversationDto {
  @IsUUID()
  @IsNotEmpty()
  parentId: string;

  @IsUUID()
  @IsNotEmpty()
  staffId: string;
}
