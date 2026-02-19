import { Module } from '@nestjs/common';
import { AuthModule } from './api/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './api/user/user.module';
import { ShopModule } from './api/shop/shop.module';
import { ReviewModule } from './api/review/review.module';
import { AwsModule } from './common/aws/aws.module';
import { AppController } from './app.controller';
import { RegionModule } from './api/region/region.module';
import { NoticeModule } from './api/notice/notice.module';
import { FeedbackModule } from './api/feedback/feedback.module';
import { LoggerModule } from './common/logger/logger.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from './common/jwt/jwt.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ExceptionFilter } from './common/filter/http-exception.filter';
import { AdminModule } from './api/admin/admin.module';
import { SuccessResponseFilter } from './common/filter/success-response.filter';
import { AdminJwtModule } from './common/admin-jwt/admin-jwt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 10,
          blockDuration: 60_000, // 제한 초과 시 1분간 차단
          ignoreUserAgents: [/Googlebot/i], // 크롤러는 제외
        },
      ],
    }),
    AuthModule,
    UserModule,
    ShopModule,
    ReviewModule,
    AwsModule,
    RegionModule,
    NoticeModule,
    FeedbackModule,
    LoggerModule,
    JwtModule,
    AdminModule,
    AdminJwtModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseFilter,
    },
  ],
})
export class AppModule {}
