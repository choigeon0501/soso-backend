import { Injectable } from '@nestjs/common';
import { FeedbackRepository } from './repositories/feedback.repository';
import { CreateFeedbackDto } from './dto/request/create-feedback.dto';
import { GetAllFeedbacksResponseDto } from './dto/response/get-all-feedbacks-response.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async findAllFeedbacksForAdmin(): Promise<GetAllFeedbacksResponseDto[]> {
    const feedbacks = await this.feedbackRepository.findAllWithUser();

    return feedbacks.map((feedback, index) => ({
      num: index + 1,
      email: feedback.user.email,
      feedback: feedback.content,
      createdAt: feedback.createdAt,
    }));
  }

  async createFeedback(body: CreateFeedbackDto, uuid: string): Promise<void> {
    await this.feedbackRepository.create(uuid, body.feedback);
  }
}
