import { RegionRepository } from './region.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RegionService {
  constructor(private regionRepository: RegionRepository) {}

  async findAllRegions() {
    return await this.regionRepository.findAllRegions();
  }
}
