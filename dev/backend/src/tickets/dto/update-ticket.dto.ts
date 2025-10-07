import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { TicketStatus } from "../ticket.entity";

export class UpdateTicketDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;

    @IsDateString()
    @IsOptional()
    dueDate?: string;
    
    @IsString()
    @IsOptional()
    openedBy?: string;

    @IsString()
    @IsOptional()
    imagePath?: string;

    @IsString()
    @IsOptional()
    department?: string;
}