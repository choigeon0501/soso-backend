import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';

@Injectable()
export class FeedbackRepository {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async findAllWithUser(): Promise<Feedback[]> {
    return this.feedbackRepository.find({ relations: ['user'], order: { createdAt: 'DESC' } });
  }

  async create(uuid: string, content: string): Promise<Feedback> {
    return this.feedbackRepository.save({ user: { uuid }, content });
  }
}
