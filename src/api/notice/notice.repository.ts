import { Notice } from './entities/notice.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

export class NoticeRepository {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async findAll() {
    return await this.noticeRepository.find({
      order: {
        createdAt: 'DESC', // 최신순 정렬
      },
    });
  }
}
