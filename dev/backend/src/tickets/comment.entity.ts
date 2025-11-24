// dev/backend/src/tickets/comment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Ticket } from "./ticket.entity";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticketId: number;

  @Column()
  autor: string;

  @Column("text")
  conteudo: string;

  @Column({ type: "text", nullable: true })
  imageUrl?: string | null;

  @CreateDateColumn({ type: "text" })
  createdAt: Date;

  // Relacionamento com Ticket
  @ManyToOne(() => Ticket, ticket => ticket.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;
}
