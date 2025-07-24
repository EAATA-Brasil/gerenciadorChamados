import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Ticket } from "./ticket.entity";
import { TicketsService } from "./tickets.service";
import { TicketsController } from "./tickets.controller";
import { TicketsGateway } from './tickets.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [TicketsService, TicketsGateway],
  controllers: [TicketsController],
})
export class TicketsModule {}
