import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  CLOSED = "closed",
}

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column()
  department: string;

  @Column({
    type: "varchar",
    length: 20,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

   @Column({ type: "text", nullable: true })
  dueDate: Date | null;

  @Column({ type: "text", nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ type: "text" })
  createdAt: Date;

  @UpdateDateColumn({ type: "text" })
  updatedAt: Date;

  // Método para verificar se está atrasado
  isOverdue(): boolean {
    if (!this.dueDate || this.status === TicketStatus.CLOSED) {
      return false;
    }
    return new Date() > new Date(this.dueDate);
  }

  // Método para calcular tempo de resolução (em dias)
  getResolutionTime(): number | null {
    if (!this.closedAt || !this.createdAt) {
      return null;
    }
    const diff = this.closedAt.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}