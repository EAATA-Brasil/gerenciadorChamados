import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Ticket } from "./ticket.entity";
import { TicketsService } from "./tickets.service";
import { TicketsController } from "./tickets.controller";
import { AppGateway } from "src/app.gateway";

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [TicketsService, AppGateway],
  controllers: [TicketsController],
})
export class TicketsModule {}
