import { Controller, Get } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { RegionService } from './region.service';
import { SuccessResponseDTO } from '../../common/dto/success-response.dto';
import { GetRegionResponseDto } from './dto/response/get-region-response.dto';

@ApiTags('Regions')
@Controller('regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @ApiOperation({ summary: '전체 지역 조회 API', description: '소품샵이 있는 모든 지역을 조회합니다.' })
  @ApiExtraModels(SuccessResponseDTO, GetRegionResponseDto)
  @ApiOkResponse({
    description: '지역 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        { properties: { result: { type: 'array', items: { $ref: getSchemaPath(GetRegionResponseDto) } } } },
      ],
    },
  })
  @Get('/')
  getRegions() {
    return this.regionService.findRegions();
  }
}
