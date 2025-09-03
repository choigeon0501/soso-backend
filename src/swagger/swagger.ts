import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { swaggerDocs } from './index.swagger';

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
    .addServer('/v1/api')
    .build();

  // SwaggerModule.createDocument를 사용해 직접 병합
  const document = SwaggerModule.createDocument(app, config);

  // SwaggerDocument 타입 유지하면서 paths를 병합하는 방식
  (document as any).paths = {
    ...document.paths,
    ...swaggerDocs.paths,
  };

  // admin 경로 제거
  if (document.paths) {
    Object.keys(document.paths).forEach((path) => {
      if (path.startsWith('/admin')) {
        delete document.paths[path];
      }
    });
  }

  // ✅ SwaggerModule.setup에 올바른 타입의 document 전달
  SwaggerModule.setup('api-docs', app, document);
}
