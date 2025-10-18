import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SuccessResponseDTO } from 'src/common/response/response.dto';
import { AppleAuthLoginDto, GoogleAuthLoginDTO, RefreshTokenDTO } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/google')
  async googleLogin(@Body() googleAuthLoginDTO: GoogleAuthLoginDTO) {
    return new SuccessResponseDTO(await this.authService.googleAuthLogin(googleAuthLoginDTO));
  }

  @Post('/apple')
  async appleLogin(@Body() appleAuthLoginDTO: AppleAuthLoginDto) {
    return new SuccessResponseDTO(await this.authService.appleAuthLogin(appleAuthLoginDTO));
  }

  @Post('/refresh')
  async refresh(@Body() refreshTokenDTO: RefreshTokenDTO) {
    return new SuccessResponseDTO(await this.authService.refresh(refreshTokenDTO));
  }
}
