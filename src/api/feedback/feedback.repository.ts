import { InjectRepository } from '@nestjs/typeorm';
import { Feedback } from './entities/feedback.entity';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';

export class FeedbackRepository {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    private readonly loggerService: LoggerService, // LoggerService 주입
  ) {}

  async saveFeedback(uuid: string, feedback: string) {
    try {
      return await this.feedbackRepository.save({ user: { uuid }, content: feedback });
    } catch (err) {
      this.loggerService.warn(`Feedback/ saveFeedback Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
