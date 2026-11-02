import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from '../entities/notice.entity';

@Injectable()
export class NoticeRepository {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async findAll(): Promise<Notice[]> {
    return this.noticeRepository.find({ order: { createdAt: 'DESC' } });
  }
}
