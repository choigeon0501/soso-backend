import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { GetUUID } from '../../common/decorators/get-uuid.decorator';
import { SuccessNoResultResponseDTO, SuccessResponseDTO } from '../../common/dto/success-response.dto';
import { CourseService } from './services/course.service';
import { CreateCourseDto } from './dto/request/create-course.dto';
import { UpdateCourseDto } from './dto/request/update-course.dto';
import { GetCourseListQueryDto } from './dto/query/get-course-list-query.dto';
import { GetVisitedShopsQueryDto } from './dto/query/get-visited-shops-query.dto';
import { GetCourseListResponseDto } from './dto/response/get-course-list-response.dto';
import { GetCourseDetailResponseDto } from './dto/response/get-course-detail-response.dto';
import { GetVisitedShopsResponseDto } from './dto/response/get-visited-shops-response.dto';
import { CreateCourseResponseDto, StampResponseDto, UnstampResponseDto } from './dto/response/stamp-response.dto';
import {
  ImportCourseResponseDto,
  ShareCourseResponseDto,
  SharedCourseResponseDto,
  UploadShareOgImageResponseDto,
} from './dto/response/share-response.dto';

@ApiTags('Course')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '내 코스 목록 조회', description: 'status 필터(all/in_progress/completed)와 페이지네이션을 지원합니다.' })
  @ApiExtraModels(SuccessResponseDTO, GetCourseListResponseDto)
  @ApiOkResponse({
    description: '코스 목록 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetCourseListResponseDto) } } }],
    },
  })
  getCourseList(@Query() query: GetCourseListQueryDto, @GetUUID() uuid: string) {
    return this.courseService.getCourseList(uuid, query);
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '코스 생성',
    description:
      '`shopIds` 배열의 **순서가 그대로 코스 내 방문 순서(orderIndex)** 가 됩니다.\n\n예) `shopIds: [12, 7, 24]` → 12번 샵이 1번째, 7번이 2번째, 24번이 3번째.\n\n프론트에서 드래그로 정렬한 결과 배열을 그대로 넘기면 됩니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, CreateCourseResponseDto)
  @ApiOkResponse({
    description: '코스 생성 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(CreateCourseResponseDto) } } }],
    },
  })
  createCourse(@Body() dto: CreateCourseDto, @GetUUID() uuid: string) {
    return this.courseService.createCourse(uuid, dto);
  }

  @Get('/visited-shops')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '내가 방문한 소품샵 목록',
    description:
      '내 코스의 스톱 중 도장이 찍힌(`visitedAt`이 존재하는) 소품샵을 모아서 반환합니다. 같은 샵이 여러 코스에 걸쳐 도장이 찍혀 있어도 **샵 단위로 중복 제거** 되며, `lastVisitedAt`은 가장 최근 방문 시각입니다. 결과는 최근 방문 순으로 정렬되며, 페이지네이션(`page`, `limit`)을 지원합니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, GetVisitedShopsResponseDto)
  @ApiOkResponse({
    description: '방문 소품샵 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetVisitedShopsResponseDto) } } }],
    },
  })
  getVisitedShops(@Query() query: GetVisitedShopsQueryDto, @GetUUID() uuid: string) {
    return this.courseService.getVisitedShops(uuid, query);
  }

  @Get('/shared/:token')
  @ApiOperation({
    summary: '공유된 코스 조회 (로그인 불필요)',
    description:
      '공유 링크 토큰으로 해당 코스의 이름·소유자 닉네임·스톱 리스트를 조회합니다. `visited_at` 같은 개인 진행 정보는 포함되지 않으며, 숨김 처리된 소품샵은 결과에서 제외됩니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, SharedCourseResponseDto)
  @ApiOkResponse({
    description: '공유 코스 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(SharedCourseResponseDto) } } }],
    },
  })
  getSharedCourse(@Param('token') token: string) {
    return this.courseService.getSharedCourse(token);
  }

  @Post('/shared/:token/import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '공유된 코스를 내 코스로 가져오기 (복제)',
    description:
      '공유 토큰으로 받은 코스를 **내 계정의 새 코스로 복제**합니다. 복제본은 원본과 독립적이며, `visited_at`은 전부 `null`로 초기화됩니다. 숨김 샵은 복제에서 제외됩니다.',
  })
  @ApiExtraModels(SuccessResponseDTO, ImportCourseResponseDto)
  @ApiOkResponse({
    description: '복제 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(ImportCourseResponseDto) } } }],
    },
  })
  importSharedCourse(@Param('token') token: string, @GetUUID() uuid: string) {
    return this.courseService.importSharedCourse(uuid, token);
  }

  @Get('/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '코스 상세 조회' })
  @ApiExtraModels(SuccessResponseDTO, GetCourseDetailResponseDto)
  @ApiOkResponse({
    description: '코스 상세 조회 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(GetCourseDetailResponseDto) } } }],
    },
  })
  getCourseDetail(@Param('courseId', ParseIntPipe) courseId: number, @GetUUID() uuid: string) {
    return this.courseService.getCourseDetail(uuid, courseId);
  }

  @Patch('/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '코스 수정 (이름/스톱 배열 전체 교체, visited_at 보존)',
    description:
      '`shopIds`를 보내면 **새 배열의 순서가 새로운 orderIndex**가 됩니다. 같은 샵이 이전에 방문된 상태였다면 `visited_at`은 보존되고, 제거된 샵은 삭제, 추가된 샵은 `visited_at=null`로 생성됩니다.\n\n예) 기존 `[12, 7]` → 새 `[7, 24, 12]` 로 보내면 7번 1번째, 24번(신규) 2번째, 12번 3번째로 재배치. 7번과 12번의 기존 도장 상태 유지.',
  })
  @ApiOkResponse({ description: '코스 수정 성공', type: SuccessNoResultResponseDTO })
  updateCourse(@Param('courseId', ParseIntPipe) courseId: number, @Body() dto: UpdateCourseDto, @GetUUID() uuid: string) {
    return this.courseService.updateCourse(uuid, courseId, dto);
  }

  @Delete('/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '코스 삭제' })
  @ApiOkResponse({ description: '코스 삭제 성공', type: SuccessNoResultResponseDTO })
  deleteCourse(@Param('courseId', ParseIntPipe) courseId: number, @GetUUID() uuid: string) {
    return this.courseService.deleteCourse(uuid, courseId);
  }

  @Post('/:courseId/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '코스 공유 링크 생성',
    description:
      '해당 코스의 공유 토큰을 반환합니다. 이미 발급된 토큰이 있으면 **기존 토큰을 그대로** 반환(멱등). 프론트는 이 토큰으로 공유 URL을 조립하면 됩니다 (예: `https://sosohan.shop/shared/{shareToken}`).',
  })
  @ApiExtraModels(SuccessResponseDTO, ShareCourseResponseDto)
  @ApiOkResponse({
    description: '공유 토큰 발급 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(ShareCourseResponseDto) } } }],
    },
  })
  generateShareToken(@Param('courseId', ParseIntPipe) courseId: number, @GetUUID() uuid: string) {
    return this.courseService.generateShareToken(uuid, courseId);
  }

  @Delete('/:courseId/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '코스 공유 링크 폐기',
    description: '기존 공유 토큰을 무효화합니다. 이후 해당 링크로는 조회·복제 모두 404가 됩니다.',
  })
  @ApiOkResponse({ description: '폐기 성공', type: SuccessNoResultResponseDTO })
  revokeShareToken(@Param('courseId', ParseIntPipe) courseId: number, @GetUUID() uuid: string) {
    return this.courseService.revokeShareToken(uuid, courseId);
  }

  @Post('/:courseId/share/og-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('ogImage'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '공유 페이지 OG 이미지 업로드 (지도 스냅샷)',
    description:
      '클라이언트가 캡처한 지도 스냅샷을 업로드합니다. 권장 사이즈 1200x630, 최대 5MB. 업로드된 public URL은 `GET /courses/shared/{token}` 응답의 `ogImageUrl`로 노출됩니다. 같은 코스에 재업로드하면 기존 이미지는 S3에서 삭제됩니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ogImage'],
      properties: {
        ogImage: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiExtraModels(SuccessResponseDTO, UploadShareOgImageResponseDto)
  @ApiOkResponse({
    description: 'OG 이미지 업로드 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(UploadShareOgImageResponseDto) } } }],
    },
  })
  uploadShareOgImage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @GetUUID() uuid: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), new FileTypeValidator({ fileType: /image\/(jpg|jpeg|png)/ })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.courseService.uploadShareOgImage(uuid, courseId, file);
  }

  @Post('/:courseId/stops/:shopId/stamp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '도장 찍기 (visited_at = now)' })
  @ApiExtraModels(SuccessResponseDTO, StampResponseDto)
  @ApiOkResponse({
    description: '도장 찍기 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(StampResponseDto) } } }],
    },
  })
  stamp(@Param('courseId', ParseIntPipe) courseId: number, @Param('shopId', ParseIntPipe) shopId: number, @GetUUID() uuid: string) {
    return this.courseService.stamp(uuid, courseId, shopId);
  }

  @Delete('/:courseId/stops/:shopId/stamp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '도장 취소 (visited_at = null)' })
  @ApiExtraModels(SuccessResponseDTO, UnstampResponseDto)
  @ApiOkResponse({
    description: '도장 취소 성공',
    schema: {
      allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(UnstampResponseDto) } } }],
    },
  })
  unstamp(@Param('courseId', ParseIntPipe) courseId: number, @Param('shopId', ParseIntPipe) shopId: number, @GetUUID() uuid: string) {
    return this.courseService.unstamp(uuid, courseId, shopId);
  }
}
