export enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    CLOSED = 'closed'
}

export class Ticket {
    id: number;
    title: string;
    description: string;
    department: string;
    status: TicketStatus;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date; // Adicionado para calcular tempo de resolução
    dueDate?: Date; // Adicionado para verificar atrasos
}