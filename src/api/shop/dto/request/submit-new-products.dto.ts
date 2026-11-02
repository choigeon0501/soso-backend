import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { ProductIdDto } from './product-id.dto';

export class SubmitNewProductsDto {
  @ApiProperty({ description: '제품 리스트', type: [ProductIdDto] })
  @IsNotEmpty()
  products?: ProductIdDto[];
}
