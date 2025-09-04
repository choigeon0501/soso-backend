import { Module } from '@nestjs/common';
import { AuthModule } from './api/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './api/user/user.module';
import { ShopModule } from './api/shop/shop.module';
import { SubmitModule } from './api/submit/submit.module';
import { ReviewModule } from './api/review/review.module';
import { AwsModule } from './api/aws/aws.module';
import { AppController } from './app.controller';
import { RegionModule } from './api/region/region.module';
import { NoticeModule } from './api/notice/notice.module';
import { FeedbackModule } from './api/feedback/feedback.module';
import { RecentSearchModule } from './api/recent-search/recent-search.module';
import { LoggerModule } from './api/logger/logger.module';
import { ReportModule } from './api/report/report.module';
import { AdminModule } from './api/admin/admin.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from './api/jwt/jwt.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TransactionsModule } from './api/transactions/transactions.module';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { AuthIdentityModule } from './api/auth-identity/auth-identity.module';
import { UserFavoriteModule } from './api/user-favorite/user-favorite.module';
import { PresignedUrlModule } from './api/presigned-url/presigned-url.module';

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
        entities: [__dirname + '/database/entity/*.entity.{ts,js}'],
        synchronize: false,
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
    SubmitModule,
    UserFavoriteModule,
    ReviewModule,
    AwsModule,
    RegionModule,
    NoticeModule,
    FeedbackModule,
    RecentSearchModule,
    LoggerModule,
    ReportModule,
    AdminModule,
    JwtModule,
    TransactionsModule,
    AuthIdentityModule,
    PresignedUrlModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
