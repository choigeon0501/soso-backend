import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/request/create-feedback.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { GetUUID } from '../../common/decorators/get-uuid.decorator';
import { SuccessNoResultResponseDTO } from '../../common/dto/success-response.dto';

@ApiTags('Feedback')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiOperation({ summary: '건의사항 등록 API' })
  @ApiOkResponse({ description: '건의사항 등록 성공', type: SuccessNoResultResponseDTO })
  @Post('/')
  createFeedback(@Body() body: CreateFeedbackDto, @GetUUID() uuid: string) {
    return this.feedbackService.createFeedback(body, uuid);
  }
}
