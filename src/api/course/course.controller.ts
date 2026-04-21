import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { GetUUID } from '../../common/deco/get-user.deco';
import { SuccessNoResultResponseDTO, SuccessResponseDTO } from '../../common/response/response.dto';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/requests/create-course.dto';
import { UpdateCourseDto } from './dto/requests/update-course.dto';
import { GetCourseListQueryDto } from './dto/query/get-course-list-query.dto';
import { GetCourseListResponseDto } from './dto/responses/get-course-list-response.dto';
import { GetCourseDetailResponseDto } from './dto/responses/get-course-detail-response.dto';
import { CreateCourseResponseDto, StampResponseDto, UnstampResponseDto } from './dto/responses/stamp-response.dto';

@ApiTags('Course')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('/')
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

  @Get('/:courseId')
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
  @ApiOperation({ summary: '코스 삭제' })
  @ApiOkResponse({ description: '코스 삭제 성공', type: SuccessNoResultResponseDTO })
  deleteCourse(@Param('courseId', ParseIntPipe) courseId: number, @GetUUID() uuid: string) {
    return this.courseService.deleteCourse(uuid, courseId);
  }

  @Post('/:courseId/stops/:shopId/stamp')
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
