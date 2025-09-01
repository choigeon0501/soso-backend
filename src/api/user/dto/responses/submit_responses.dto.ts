import { ApiProperty } from '@nestjs/swagger';
import { SubmitUserRecord } from '../../../../database/entity/submit-user-record.entity';
import { PaginationResponsesDto } from './pagination_responses.dto';
import { SubmitStatus, SubmitType } from '../../../../common/enum/role.enum';

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
  @ApiProperty({ nullable: true }) rejectMessage: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: () => ShopResponseDTO }) shop: ShopResponseDTO;

  constructor(record: SubmitUserRecord) {
    this.id = record.id;
    this.type = record.type;
    this.status = record.status;
    this.rejectMessage = record.rejectMessage;
    this.createdAt = record.createdAt;
    this.shop = record.shop;
  }
}

export class UserSubmitRecordDTO extends PaginationResponsesDto<UserSubmitRecordItemDTO> {}
