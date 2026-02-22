import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels() // 중요: Swagger에 제네릭 대상 등록
export class SuccessResponseDTO<T = any> {
  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ required: true })
  result: T;

  constructor(result: T = null) {
    this.message = 'Success';
    this.status = 200;
    this.result = result;
  }
}

export class SuccessNoResultResponseDTO {
  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  constructor() {
    this.message = 'Success';
    this.status = 200;
  }
}
