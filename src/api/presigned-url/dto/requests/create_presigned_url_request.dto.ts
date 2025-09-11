import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { UploadType } from '../../../../common/enum/image.enum';
import { Type } from 'class-transformer';

export class PresignedFileDTO {
  @ApiProperty({
    description: '사용자가 업로드하려는 원본 파일명',
    example: 'profile.png',
  })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({
    description: '콘텐츠 타입(MIME). 허용되는 이미지 타입만 전달',
    enum: ['image/jpeg', 'image/png', 'image/jpg'],
    example: 'image/png',
  })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/jpg'])
  contentType: string;
}

export class CreatePresignedDTO extends PresignedFileDTO {
  @ApiProperty({
    description: '사용자가 업로드하려는 이미지 종류',
    enum: UploadType,
    example: 'user',
  })
  @IsEnum(UploadType)
  @IsNotEmpty()
  uploadType: UploadType;
}

export class CreatePresignedListDTO {
  @ApiProperty({ type: [PresignedFileDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignedFileDTO)
  files: PresignedFileDTO[];

  @ApiProperty({
    description: '사용자가 업로드하려는 이미지 종류',
    enum: UploadType,
    example: 'user',
  })
  @IsEnum(UploadType)
  @IsNotEmpty()
  uploadType: UploadType;
}
