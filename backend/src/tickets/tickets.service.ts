import { Injectable, NotFoundException } from "@nestjs/common";
import { Ticket, TicketStatus } from "./ticket.entity";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";

@Injectable()
export class TicketsService {
    private tickets: Ticket[] = [];
    private idCounter = 1;

    create(dto: CreateTicketDto): Ticket {
        const ticket: Ticket = {
            id: this.idCounter++,
            title: dto.title,
            description: dto.description,
            department: dto.department,
            status: TicketStatus.OPEN,
            createdAt: new Date(),
            updatedAt: new Date(),
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
        };
        this.tickets.push(ticket);
        return ticket;
    }

    findAll(): Ticket[] {
        return this.tickets;
    }

    findOne(id: number): Ticket {
        const ticket = this.tickets.find(t => t.id === id);
        if (!ticket) throw new NotFoundException('Ticket Not Found');
        return ticket;
    }

    update(id: number, dto: UpdateTicketDto): Ticket {
        const ticket = this.findOne(id);
        
        if (dto.title) ticket.title = dto.title;
        if (dto.description) ticket.description = dto.description;
        if (dto.status) {
            ticket.status = dto.status;
            if (dto.status === TicketStatus.CLOSED) {
                ticket.closedAt = new Date();
            }
        }
        
        ticket.updatedAt = new Date();
        return ticket;
    }

    remove(id: number) {
        const index = this.tickets.findIndex((t) => t.id === id);
        if (index === -1) throw new NotFoundException("Ticket Not Found");
        this.tickets.splice(index, 1);
    }

    // Novo método para relatório
    getTicketsForReport(startDate: Date, endDate: Date) {
        return this.tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            return ticketDate >= startDate && ticketDate <= endDate;
        });
    }
}