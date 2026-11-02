import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from '../entities/region.entity';

@Injectable()
export class RegionRepository {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async findByName(name: string): Promise<Region | null> {
    return this.regionRepository.findOne({ where: { name } });
  }

  async findAll(): Promise<Region[]> {
    return this.regionRepository.find();
  }
}
