import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { Notice } from './entities/notice.entity';
import { NoticeRepository } from './repositories/notice.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
})
export class NoticeModule {}
