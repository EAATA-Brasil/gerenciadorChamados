import { Injectable, NotFoundException } from "@nestjs/common";
import { Ticket, TicketStatus } from "./ticket.entity";
import { CreateTicketDto } from "./dto/create-ticket.dto";

@Injectable()
export class TicketsService{
    private tickets: Ticket[] = []
    private idCounter = 1

    create(dto: CreateTicketDto):Ticket{
        const ticket: Ticket = {
            id:this.idCounter++,
            title:dto.title,
            description:dto.description,
            
            department:dto.department,
            status: TicketStatus.OPEN,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        this.tickets.push(ticket)
        return ticket
    }

    findAll():Ticket[]{
        return this.tickets
    }

    findOne(id: number):Ticket{
        const ticket = this.tickets.find(t => t.id === id)
        if (!ticket) throw new NotFoundException('Ticket Not Found')
        return ticket
    }
}
