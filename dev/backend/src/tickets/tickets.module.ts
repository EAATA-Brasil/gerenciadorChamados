// dev/backend/src/tickets/tickets.module.ts (ATUALIZADO)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { CommentsService } from './comments.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './ticket.entity';
import { Comment } from './comment.entity';
import { AppGateway } from 'src/app.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Comment])],
  controllers: [TicketsController],
  providers: [TicketsService, CommentsService, AppGateway],
  exports: [TicketsService, CommentsService]
})
export class TicketsModule {}

