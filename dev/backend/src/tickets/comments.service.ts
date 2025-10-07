// dev/backend/src/tickets/comments.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Comment } from "./comment.entity";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  // dev/backend/src/tickets/comments.service.ts (CORRIGIDO)
  async create(dto: CreateCommentDto): Promise<Comment> {
    // VALIDAÇÃO: Garantir que ticketId existe
    if (!dto.ticketId) {
      throw new Error('ticketId é obrigatório');
    }

    const comment = new Comment();
    comment.ticketId = dto.ticketId;
    comment.autor = dto.autor;
    comment.conteudo = dto.conteudo;
    comment.createdAt = new Date();
    
    return await this.commentRepository.save(comment);
  }

  async findByTicketId(ticketId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment Not Found');
    return comment;
  }

  async update(id: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);
    
    if (dto.conteudo) {
      comment.conteudo = dto.conteudo;
    }
    
    return await this.commentRepository.save(comment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.commentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Comment Not Found");
    }
  }
}

