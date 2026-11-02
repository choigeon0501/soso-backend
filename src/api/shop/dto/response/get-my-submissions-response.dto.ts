import { ApiProperty } from '@nestjs/swagger';
import { PageInfoDto } from '../../../../common/dto/page-info.dto';
import { SubmitStatus, SubmitType } from '../../const/submit.const';

export class MySubmissionShopResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) mainImage: string | null;
  @ApiProperty() isVerified: boolean;
  @ApiProperty({ nullable: true }) instagram: string | null;
  @ApiProperty({ nullable: true }) location: string | null;
}

export class MySubmissionItemResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() type: SubmitType;
  @ApiProperty() status: SubmitStatus;
  @ApiProperty() submitStatus: string;
  @ApiProperty({ nullable: true }) rejectMessage: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: MySubmissionShopResponseDto, nullable: true }) shop: MySubmissionShopResponseDto | null;
}

export class GetMySubmissionsResponseDto {
  @ApiProperty({ type: [MySubmissionItemResponseDto], description: '사용자 제보/등록 리스트' })
  data: MySubmissionItemResponseDto[];

  @ApiProperty({ type: () => PageInfoDto, description: '페이지네이션 정보' })
  pageInfo: PageInfoDto;
}
