import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './sector.entity';

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector)
    private sectorsRepository: Repository<Sector>,
  ) {}

  findAll(): Promise<Sector[]> {
    return this.sectorsRepository.find();
  }

  findOne(id: number): Promise<Sector | null> {
    return this.sectorsRepository.findOneBy({ id });
  }

  async create(name: string): Promise<Sector> {
    const sector = this.sectorsRepository.create({ name });
    return this.sectorsRepository.save(sector);
  }

  async remove(id: number): Promise<void> {
    await this.sectorsRepository.delete(id);
  }
}

