import { ApiProperty } from '@nestjs/swagger';
import { Notice } from '../entities/notice.entity';

export class NoticeDTO {
  @ApiProperty({ description: '공지 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '공지 제목', example: '서버 점검 안내' })
  title: string;

  @ApiProperty({ description: '공지 내용', example: '서버 점검으로 인해 8월 10일 00:00~02:00 서비스가 중단됩니다.' })
  content: string;

  @ApiProperty({ description: '작성일', example: '2025-08-06T12:34:56.000Z' })
  createdAt: Date;

  constructor(id: number, title: string, content: string, createdAt: Date) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.createdAt = createdAt;
  }

  static fromEntity(entity: Notice): NoticeDTO {
    return new NoticeDTO(entity.id, entity.title, entity.content, entity.createdAt);
  }
}
