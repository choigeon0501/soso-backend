import { Notice } from '../../database/entity/notice.entity';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from '../../common/logger/logger.service';

export class NoticeRepository {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    private readonly loggerService: LoggerService, // LoggerService 주입
  ) {}

  async findAll() {
    try {
      return await this.noticeRepository.find({
        order: {
          createdAt: 'DESC', // 최신순 정렬
        },
      });
    } catch (err) {
      this.loggerService.warn(`Notice/ findAll Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
