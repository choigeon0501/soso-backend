import { InjectRepository } from '@nestjs/typeorm';
import { Feedback } from '../../database/entity/feedback.entity';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

export class FeedbackRepository {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    private readonly loggerService: LoggerService, // LoggerService 주입
  ) {}

  async saveFeedback(uuid: string, feedback: string) {
    try {
      const newFeedback = await this.feedbackRepository.save({ user: { uuid }, text: feedback });
      return await this.feedbackRepository.save(newFeedback);
    } catch (err) {
      this.loggerService.warn(`Feedback/ saveFeedback Error: ${err}`);
      throw new InternalServerErrorException();
    }
  }
}
