import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { Sector } from './sector.entity';

@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Get('')
  findAll(): Promise<Sector[]> {
    return this.sectorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Sector | null> {
    return this.sectorsService.findOne(+id);
  }

  @Post('')
  create(@Body('name') name: string): Promise<Sector> {
    return this.sectorsService.create(name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.sectorsService.remove(+id);
  }
}

