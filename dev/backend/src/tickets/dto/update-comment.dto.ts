// dev/backend/src/tickets/dto/update-comment.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  conteudo?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentName?: string;
}

