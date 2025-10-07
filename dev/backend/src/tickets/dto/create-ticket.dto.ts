// dev/backend/src/tickets/dto/create-ticket.dto.ts (ATUALIZADO)
import { IsDate, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsOptional()
  openedBy: string;

  @IsString()
  @IsOptional()
  imagePath: string;

  @IsDate()
  @IsOptional()
  dueDate?: Date;
}

