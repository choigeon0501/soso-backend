import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: '코스 이름 (1~30자)', example: '성수동 데이트 코스', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  name: string;

  @ApiProperty({
    description: '코스에 포함할 소품샵 ID 배열 (순서 유지, 2~30개, 중복 불가)',
    example: [12, 7, 24],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  shopIds: number[];
}
