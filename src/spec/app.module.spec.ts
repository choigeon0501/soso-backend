import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { LoggerService } from '../common/logger/logger.service';

/**
 * DB 없이 AppModule 전체를 컴파일한다. 모듈 exports 누락·forwardRef 없는 순환은 compile()에서 실패한다.
 * forFeature 리포지토리 팩토리가 dataSource.getRepository·entityMetadatas·options를 읽으므로 그것만 채운다.
 */
const fakeDataSource = {
  options: { type: 'mysql' },
  entityMetadatas: [],
  getRepository: () => ({}),
  createEntityManager: () => ({}),
  manager: {},
  destroy: async () => undefined,
};

/** 스키마 이름과 설명 문구는 버리고 필드 구조(이름·타입·필수 여부)만 남긴다. */
function shape(schema: any, doc: OpenAPIObject, depth = 0): any {
  if (!schema || depth > 6) return schema ? '…' : undefined;
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop();
    return shape(doc.components.schemas[name], doc, depth + 1);
  }
  if (schema.allOf) return { allOf: schema.allOf.map((s) => shape(s, doc, depth + 1)) };
  if (schema.oneOf) return { oneOf: schema.oneOf.map((s) => shape(s, doc, depth + 1)) };
  const out: any = {};
  if (schema.type) out.type = schema.type;
  if (schema.enum) out.enum = schema.enum;
  if (schema.format) out.format = schema.format;
  if (schema.required) out.required = [...schema.required].sort();
  if (schema.items) out.items = shape(schema.items, doc, depth + 1);
  if (schema.properties) {
    out.properties = Object.fromEntries(
      Object.keys(schema.properties)
        .sort()
        .map((key) => [key, shape(schema.properties[key], doc, depth + 1)]),
    );
  }
  return out;
}

function contractOf(doc: OpenAPIObject) {
  const contract: Record<string, any> = {};
  for (const path of Object.keys(doc.paths).sort()) {
    for (const method of Object.keys(doc.paths[path]).sort()) {
      const op = doc.paths[path][method];
      contract[`${method.toUpperCase()} ${path}`] = {
        security: op.security ?? [],
        parameters: (op.parameters ?? [])
          .map((p: any) => ({ name: p.name, in: p.in, required: !!p.required, schema: shape(p.schema, doc) }))
          .sort((a, b) => `${a.in}${a.name}`.localeCompare(`${b.in}${b.name}`)),
        requestBody: op.requestBody
          ? Object.fromEntries(Object.entries(op.requestBody.content).map(([type, c]: any) => [type, shape(c.schema, doc)]))
          : null,
        responses: Object.fromEntries(
          Object.entries(op.responses ?? {}).map(([status, r]: any) => [
            status,
            r.content ? Object.fromEntries(Object.entries(r.content).map(([type, c]: any) => [type, shape(c.schema, doc)])) : null,
          ]),
        ),
      };
    }
  }
  return contract;
}

describe('AppModule', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDataSourceToken())
      .useValue(fakeDataSource)
      .overrideProvider(LoggerService)
      .useValue({ logError: () => undefined })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v2/api');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('DB 없이 모든 모듈이 컴파일된다', () => {
    expect(app).toBeDefined();
  });

  /**
   * 라우트·파라미터·요청/응답 필드 구조가 계약이다. DTO 클래스 이름이 바뀌어도 이 스냅샷은 그대로여야 한다.
   * 의도한 계약 변경일 때만 `jest -u`로 갱신한다.
   */
  it('API 계약(경로·파라미터·필드 구조)이 바뀌지 않는다', () => {
    const config = new DocumentBuilder().addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth').build();
    const document = SwaggerModule.createDocument(app, config);

    expect(contractOf(document)).toMatchSnapshot();
  });
});
