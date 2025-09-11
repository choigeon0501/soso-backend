import { Controller, Get } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { SuccessResponseDTO } from '../../common/response/response.dto';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { NoticeDTO } from './dto/notice-response.dto';

@ApiTags('Notices')
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}
  @Get('/')
  @ApiExtraModels(SuccessResponseDTO, NoticeDTO)
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: '등록된 공지사항 리스트를 반환합니다.',
  })
  @ApiOkResponse({
    description: '공지사항 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: {
              type: 'array',
              items: { $ref: getSchemaPath(NoticeDTO) },
            },
          },
        },
      ],
    },
  })
  async getNotice() {
    return new SuccessResponseDTO(await this.noticeService.findAll());
  }
}
