import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackRepository } from './repositories/feedback.repository';
import { Feedback } from './entities/feedback.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback])],
  exports: [FeedbackService],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}
