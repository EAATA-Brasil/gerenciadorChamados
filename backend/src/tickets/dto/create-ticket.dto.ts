import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  department: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
