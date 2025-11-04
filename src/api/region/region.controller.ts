import { RegionService } from './region.service';
import { Controller, Get } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { SuccessResponseDTO } from '../../common/response/response.dto';
import { ShopRegionDTO } from './dto/responses/region_response';

@ApiTags('Regions')
@Controller('regions')
export class RegionController {
  constructor(private regionService: RegionService) {}

  @Get('/')
  @ApiOperation({
    summary: '전체 지역 조회',
    description: '소품샵이 있는 모든 지역을 조회합니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, ShopRegionDTO)
  @ApiOkResponse({
    description: '지역 목록 조회 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: {
              type: 'array',
              items: { $ref: getSchemaPath(ShopRegionDTO) },
            },
          },
        },
      ],
    },
  })
  getAllShopRegions() {
    return this.regionService.findAllRegions();
  }
}
