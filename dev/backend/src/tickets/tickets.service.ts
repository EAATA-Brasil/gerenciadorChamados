import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Ticket, TicketStatus } from "./ticket.entity";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { AppGateway } from "src/app.gateway";

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly gateway: AppGateway
  ) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
      // Correção: Criar a entidade corretamente
      const ticket = new Ticket();
      ticket.title = dto.title;
      ticket.description = dto.description;
      ticket.department = dto.department;
      ticket.status = TicketStatus.OPEN;
      ticket.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      ticket.closedAt = null;
      ticket.createdAt = new Date();
      ticket.updatedAt = new Date();
      
      this.gateway.notifyNewCall(ticket)
      return await this.ticketRepository.save(ticket);
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find();
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket Not Found');
    return ticket;
  }

  async update(id: number, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (dto.title) ticket.title = dto.title;
    if (dto.description) ticket.description = dto.description;
    
    if (dto.status) {
      if (!Object.values(TicketStatus).includes(dto.status)) {
        throw new BadRequestException('Status inválido');
      }
      ticket.status = dto.status;
      if (dto.status === TicketStatus.CLOSED && !ticket.closedAt) {
        ticket.closedAt = new Date();
      }
    }

    ticket.updatedAt = new Date();
    return await this.ticketRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ticketRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Ticket Not Found");
    }
  }

  async getTicketsForReport(startDate: Date, endDate: Date): Promise<Ticket[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return await this.ticketRepository.find({
      where: {
        createdAt: Between(start, end)
      }
    });
  }

  // Métodos auxiliares para verificar status
  async isOverdue(id: number): Promise<boolean> {
    const ticket = await this.findOne(id);
    if (!ticket.dueDate || ticket.status === TicketStatus.CLOSED) {
      return false;
    }
    return new Date() > new Date(ticket.dueDate);
  }

  async getResolutionTime(id: number): Promise<number | null> {
    const ticket = await this.findOne(id);
    if (!ticket.closedAt || !ticket.createdAt) {
      return null;
    }
    const diff = ticket.closedAt.getTime() - ticket.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}