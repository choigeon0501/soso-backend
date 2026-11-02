import { Injectable } from '@nestjs/common';
import { NoticeRepository } from './repositories/notice.repository';
import { GetNoticeResponseDto } from './dto/response/get-notice-response.dto';

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async findNotices(): Promise<GetNoticeResponseDto[]> {
    const notices = await this.noticeRepository.findAll();

    return notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt,
    }));
  }
}
