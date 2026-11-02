import { ApiProperty } from '@nestjs/swagger';
import { ShopSubmitRecord } from '../../../shop/entities/shop-submit-user-record.entity';
import { PageInfoDTO, PaginationResponsesDto } from './pagination_responses.dto';
import { SubmitStatus, SubmitType, getSubmitCombinedStatus } from '../../../shop/const/submit.const';

export class ShopResponseDTO {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) mainImage: string | null;
  @ApiProperty() isVerified: boolean;
  @ApiProperty({ nullable: true }) instagram: string | null;
  @ApiProperty({ nullable: true }) location: string | null;
}

export class UserSubmitRecordItemDTO {
  @ApiProperty() id: number;
  @ApiProperty() type: SubmitType;
  @ApiProperty() status: SubmitStatus;
  @ApiProperty() submitStatus: string;
  @ApiProperty({ nullable: true }) rejectMessage: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: ShopResponseDTO, nullable: true }) shop: ShopResponseDTO | null;

  constructor(record: ShopSubmitRecord) {
    this.id = record.id;
    this.type = record.type;
    this.status = record.status;
    this.submitStatus = getSubmitCombinedStatus(record.type, record.status);
    this.rejectMessage = record.rejectMessage;
    this.createdAt = record.createdAt;
    this.shop = record.shop
      ? {
          id: record.shop.id,
          name: record.shop.name,
          mainImage: record.shop.mainImage ?? null,
          isVerified: !!record.shop.isVerified,
          instagram: record.shop.instagram ?? null,
          location: record.shop.location ?? null,
        }
      : null;
  }
}

export class UserSubmitRecordDTO extends PaginationResponsesDto<UserSubmitRecordItemDTO> {
  @ApiProperty({ type: [UserSubmitRecordItemDTO], description: '사용자 제보/등록 리스트' })
  data: UserSubmitRecordItemDTO[];

  @ApiProperty({ type: () => PageInfoDTO, description: '페이지네이션 정보' })
  pageInfo: PageInfoDTO;
}
