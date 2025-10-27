import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { CustomValidationPipe } from './common/pipe/validationPipe.pipe';
import { setupSwagger } from './swagger/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const port = process.env.NODE_ENV == 'prd' ? 443 : 80;
  const isProd = process.env.NODE_ENV === 'prd';

  const httpsOptions = isProd
    ? {
        key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/api.sosohan.shop.key', 'utf8'),
        cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/api.sosohan.shop.crt', 'utf8'),
        ca: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/api.sosohan.shop.issuer.crt', 'utf8'),
      }
    : undefined;

  const app = await NestFactory.create(AppModule, isProd ? { httpsOptions } : undefined);
  app.use(
    helmet({
      // contentSecurityPolicy: {
      //   directives: {
      //     defaultSrc: ["'none'"], // 기본적으로 아무 것도 허용하지 않음
      //     connectSrc: ["'self'", 'https://soso-client-soso-web.vercel.app'], // 프론트에서 API 요청 가능
      //     frameAncestors: ["'none'"], // iframe 안에 이 백엔드를 넣는 것 금지 (clickjacking 방지)
      //   },
      // },
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false, // 프론트 쪽 지도 등 리소스 사용에 영향 → off
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // iframe 접근 제한
  app.use(helmet.frameguard({ action: 'deny' }));
  app.useGlobalPipes(new CustomValidationPipe());
  app.enableCors({
    origin: (origin, callback) => {
      // origin이 존재하지 않는 경우(null)도 허용 (서버 간 요청, Postman)
      if (!origin || true) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  setupSwagger(app);

  app.setGlobalPrefix('v2/api');
  // HTTPS 포트 443 사용
  await app.listen(port);
}

bootstrap();
