import { Controller, Get } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { SuccessResponseDTO } from '../../common/dto/success-response.dto';
import { GetNoticeResponseDto } from './dto/response/get-notice-response.dto';

@ApiTags('Notices')
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @ApiOperation({ summary: '공지사항 목록 조회 API', description: '등록된 공지사항 리스트를 반환합니다.' })
  @ApiExtraModels(SuccessResponseDTO, GetNoticeResponseDto)
  @ApiOkResponse({
    description: '공지사항 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        { properties: { result: { type: 'array', items: { $ref: getSchemaPath(GetNoticeResponseDto) } } } },
      ],
    },
  })
  @Get('/')
  getNotices() {
    return this.noticeService.findNotices();
  }
}
