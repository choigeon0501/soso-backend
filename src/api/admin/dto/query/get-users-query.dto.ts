import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: '회원 목록: true, 탈퇴 목록: false',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return true;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({
    description: '가입일 순: created, 최근 활동 순: lastActiveAt',
    example: 'created',
    enum: ['created', 'lastActiveAt'],
    default: 'created',
  })
  @IsOptional()
  @IsIn(['created', 'lastActiveAt'])
  sortBy?: 'created' | 'lastActiveAt' = 'created';

  @ApiPropertyOptional({
    description: '최신순: desc, 오래된 순: asc',
    example: 'desc',
    enum: ['desc', 'asc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['desc', 'asc'])
  order?: 'desc' | 'asc' = 'desc';
}
