import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService){}

    @Post()
    create(@Body() dto: CreateTicketDto) {

        console.log("Nova chamada", JSON.stringify(dto))
        return this.ticketsService.create(dto);
    }

    @Get()
    findAll() {
        return this.ticketsService.findAll();
    }  

    @Get("report")
    getReport(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string
    ) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return this.ticketsService.getTicketsForReport(start, end);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ticketsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
        return this.ticketsService.update(+id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ticketsService.remove(+id);
    }
    
}