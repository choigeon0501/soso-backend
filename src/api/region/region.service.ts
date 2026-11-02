import { Injectable } from '@nestjs/common';
import { RegionRepository } from './repositories/region.repository';
import { Region } from './entities/region.entity';

@Injectable()
export class RegionService {
  constructor(private readonly regionRepository: RegionRepository) {}

  async findRegions(): Promise<Region[]> {
    return this.regionRepository.findAll();
  }

  async findRegionByName(name: string): Promise<Region | null> {
    return this.regionRepository.findByName(name);
  }
}
