import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Sector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
