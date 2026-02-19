import { InjectRepository } from '@nestjs/typeorm';
import { Feedback } from './entities/feedback.entity';
import { Repository } from 'typeorm';

export class FeedbackRepository {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async findAll() {
    return await this.feedbackRepository.find({ relations: ['user'], order: { createdAt: 'DESC' } });
  }

  async saveFeedback(uuid: string, feedback: string) {
    return await this.feedbackRepository.save({ user: { uuid }, content: feedback });
  }
}
