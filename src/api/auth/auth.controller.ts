import { Body, Controller, Post } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { GoogleLoginDto } from './dto/request/google-login.dto';
import { AppleLoginDto } from './dto/request/apple-login.dto';
import { ReissueTokenDto } from './dto/request/reissue-token.dto';
import { AuthTokenResponseDto } from './dto/response/auth-token-response.dto';
import { SuccessResponseDTO } from '../../common/dto/success-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '구글 소셜 로그인 API' })
  @ApiExtraModels(SuccessResponseDTO, AuthTokenResponseDto)
  @ApiOkResponse({
    description: '로그인 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(AuthTokenResponseDto) } } }] },
  })
  @Post('/google')
  googleLogin(@Body() body: GoogleLoginDto) {
    return this.authService.googleLogin(body);
  }

  @ApiOperation({ summary: '애플 소셜 로그인 API' })
  @ApiExtraModels(SuccessResponseDTO, AuthTokenResponseDto)
  @ApiOkResponse({
    description: '로그인 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(AuthTokenResponseDto) } } }] },
  })
  @Post('/apple')
  appleLogin(@Body() body: AppleLoginDto) {
    return this.authService.appleLogin(body);
  }

  @ApiOperation({ summary: '만료된 토큰 재발급 API' })
  @ApiExtraModels(SuccessResponseDTO, AuthTokenResponseDto)
  @ApiOkResponse({
    description: '재발급 성공',
    schema: { allOf: [{ $ref: getSchemaPath(SuccessResponseDTO) }, { properties: { result: { $ref: getSchemaPath(AuthTokenResponseDto) } } }] },
  })
  @Post('/refresh')
  reissueToken(@Body() body: ReissueTokenDto) {
    return this.authService.reissueToken(body);
  }
}
