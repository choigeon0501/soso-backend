import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, getSchemaPath } from '@nestjs/swagger';
import { SuccessResponseDTO } from '../../common/response/response.dto';
import { PresignedUrlService } from './presigned-url.service';
import { CreatePresignedDTO, CreatePresignedListDTO } from './dto/requests/create_presigned_url_request.dto';
import { PreSignedURLListResponsesDTO, PreSignedURLResponsesDTO } from './dto/responses/create_presigned_url_response.dto';

@Controller('presigned-url')
export class PresignedUrlController {
  constructor(private presignedUrlService: PresignedUrlService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiExtraModels(SuccessResponseDTO, PreSignedURLResponsesDTO)
  @ApiOperation({
    summary: '한 개 이미지 등록 - Presigned',
    description: 'return 받은 URL을 PUT 메서드로 클라이언트에서 이미지를 등록시키세요.',
  })
  @ApiOkResponse({
    description: 'Presigned URL 발급 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(PreSignedURLResponsesDTO) } } }],
    },
  })
  async createPresignedURL(@Body() createPresignedDTO: CreatePresignedDTO) {
    return new SuccessResponseDTO(await this.presignedUrlService.createPresignedURL(createPresignedDTO));
  }

  @Post('/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiExtraModels(SuccessResponseDTO, PreSignedURLListResponsesDTO)
  @ApiOperation({
    summary: '여러 개 이미지 등록 - PreSigned',
    description: 'return 받은 URL 배열을 클라이언트에서 PUT 메서드로 S3에 업로드하세요.',
  })
  @ApiOkResponse({
    description: 'Presigned URL 발급 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: {
              type: 'array',
              items: { $ref: getSchemaPath(PreSignedURLResponsesDTO) },
            },
          },
        },
      ],
    },
  })
  async createPresignedURLList(@Body() createPresignedListDTO: CreatePresignedListDTO) {
    return new SuccessResponseDTO(await this.presignedUrlService.createPresignedURLList(createPresignedListDTO));
  }
}
