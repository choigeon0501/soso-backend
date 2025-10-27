import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SoSo 프로젝트 API 문서')
    .setDescription('SoSo 프로젝트 서비스에 관련된 문서입니다.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('/v2/api')
    .build();

  // SwaggerModule.createDocument를 사용해 자동 생성된 문서 생성
  const document = SwaggerModule.createDocument(app, config);

  // admin 경로 제거
  if (document.paths) {
    Object.keys(document.paths).forEach((path) => {
      if (path.startsWith('/admin')) {
        delete document.paths[path];
      }
    });
  }

  // SwaggerModule.setup에 병합된 document 전달
  SwaggerModule.setup('api-docs', app, document);
}
