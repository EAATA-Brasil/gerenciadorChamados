// dev/backend/src/tickets/dto/create-comment.dto.ts (CORRIGIDO)
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsNumber()
  @IsOptional() // Tornar opcional pois será definido no controller
  ticketId?: number;

  @IsString()
  @IsNotEmpty()
  autor: string;

  @IsString()
  @IsNotEmpty()
  conteudo: string;
}