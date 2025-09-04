import { Module } from '@nestjs/common';
import { PresignedUrlController } from './presigned-url.controller';
import { PresignedUrlService } from './presigned-url.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [PresignedUrlController],
  providers: [PresignedUrlService],
})
export class PresignedUrlModule {}
