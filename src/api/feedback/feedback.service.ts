import { Injectable } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { SaveFeedbackDTO } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private feedbackRepository: FeedbackRepository) {}

  async getAllFeedbacks() {
    const allFeedbacks = await this.feedbackRepository.findAll();

    return allFeedbacks.map((feedback, index) => ({
      num: index + 1,
      email: feedback.user.email,
      feedback: feedback.content,
      createdAt: feedback.createdAt,
    }));
  }

  async saveFeedback(uuid: string, saveFeedbackDTO: SaveFeedbackDTO): Promise<void> {
    const { feedback } = saveFeedbackDTO;
    await this.feedbackRepository.saveFeedback(uuid, feedback);
  }
}
