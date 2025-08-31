import { ApiProperty } from '@nestjs/swagger';
import { Pagination_responsesDto } from './pagination_responses.dto';
import { SubmitUserRecord } from '../../../../database/entity/submit-user-record.entity';
import { getSubmitStatusEnum } from '../../../../common/function/get-submit-status-enum';

export class ShopResponseDTO {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) image: string | null;
  @ApiProperty() type: number;
  @ApiProperty({ nullable: true }) instagram: string | null;
  @ApiProperty({ nullable: true }) location: string | null;
}

export class UserSubmitRecordItemDTO {
  @ApiProperty() id: number;
  @ApiProperty() type: number;
  @ApiProperty() status: number;
  @ApiProperty({ nullable: true }) rejectMessage: string | null;
  @ApiProperty() submitStatus: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: () => ShopResponseDTO }) shop: ShopResponseDTO;

  constructor(record: SubmitUserRecord) {
    this.id = record.id;
    this.type = record.type;
    this.status = record.status;
    this.rejectMessage = record.rejectMessage;
    this.submitStatus = getSubmitStatusEnum(record.type, record.status);
    this.createdAt = record.createdAt;
    this.shop = record.shop;
  }
}

export class UserSubmitRecordDTO extends Pagination_responsesDto<UserSubmitRecordItemDTO> {}
