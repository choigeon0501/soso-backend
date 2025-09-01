import { ApiProperty } from '@nestjs/swagger';

export class PageInfoDTO {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalElements: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() nextPage: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.totalElements = total;
    this.totalPages = Math.ceil(total / limit);
    this.nextPage = page < this.totalPages;
  }
}

export class PaginationResponsesDto<T> {
  @ApiProperty({ isArray: true }) data: T[];
  @ApiProperty({ type: PageInfoDTO }) pageInfo: PageInfoDTO;

  constructor(data: T[], pageInfo: PageInfoDTO) {
    this.data = data;
    this.pageInfo = pageInfo;
  }
}
