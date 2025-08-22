import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SuccessResponseDTO } from 'src/common/response/response.dto';
import { AppleAuthLoginDto, AuthTokenResponseDTO, GoogleAuthLoginDTO, RefreshTokenDTO } from './dto/auth.dto';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/google')
  @ApiExtraModels(SuccessResponseDTO, AuthTokenResponseDTO)
  @ApiOperation({
    summary: '구글 소셜 로그인',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: { $ref: getSchemaPath(AuthTokenResponseDTO) },
          },
        },
      ],
    },
  })
  async googleLogin(@Body() googleAuthLoginDTO: GoogleAuthLoginDTO) {
    return new SuccessResponseDTO(await this.authService.googleAuthLogin(googleAuthLoginDTO));
  }

  @Post('/apple')
  @ApiExtraModels(SuccessResponseDTO, AuthTokenResponseDTO)
  @ApiOperation({
    summary: '애플 소셜 로그인',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: { $ref: getSchemaPath(AuthTokenResponseDTO) },
          },
        },
      ],
    },
  })
  async appleLogin(@Body() appleAuthLoginDTO: AppleAuthLoginDto) {
    return new SuccessResponseDTO(await this.authService.appleAuthLogin(appleAuthLoginDTO));
  }

  @Post('/refresh')
  @ApiExtraModels(SuccessResponseDTO, AuthTokenResponseDTO)
  @ApiOperation({
    summary: '만료된 토큰 재발급',
  })
  @ApiOkResponse({
    description: '재발급 성공',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDTO) },
        {
          properties: {
            result: { $ref: getSchemaPath(AuthTokenResponseDTO) },
          },
        },
      ],
    },
  })
  async refreshToken(@Body() refreshTokenDTO: RefreshTokenDTO) {
    return new SuccessResponseDTO(await this.authService.refreshToken(refreshTokenDTO));
  }

  @Get('/test')
  async test() {
    return new SuccessResponseDTO(await this.authService.test());
  }
}
