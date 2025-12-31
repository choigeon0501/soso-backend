import { Body, Controller, Post } from '@nestjs/common';
import { AppleService } from './apple.service';

@Controller('apple')
export class AppleController {
  constructor(private readonly appleService: AppleService) {}

  @Post('notification')
  async appleNotifications(@Body() body: { signedPayload: string }) {
    return this.appleService.appleNotifications(body);
  }
}
