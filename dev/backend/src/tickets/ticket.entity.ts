// dev/backend/src/tickets/ticket.entity.ts (ATUALIZADO)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Comment } from "./comment.entity";

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

  // Novo campo para imagem
  @Column({ type: "text", nullable: true })
  imagePath: string | null;

  // Novo campo para usuário que abriu o chamado
  @Column({ nullable: true })
  openedBy: string;

  @CreateDateColumn({ type: "text" })
  createdAt: Date;

  @UpdateDateColumn({ type: "text" })
  updatedAt: Date;

  // Relacionamento com comentários
  @OneToMany(() => Comment, comment => comment.ticket, { cascade: true })
  comments: Comment[];

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

