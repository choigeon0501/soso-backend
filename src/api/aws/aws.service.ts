import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsService {
  s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly allowed = ['image/jpeg', 'image/png'];

  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    try {
      this.region = this.configService.get<string>('AWS_REGION');
      this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
          secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
        },
      });
    } catch (err) {
      this.loggerService.warn(`S3/ 초기화 에러: ${err}`);
    }
  }

  async uploadImagesToS3(files: Express.Multer.File[] | Express.Multer.File | undefined, ext: string): Promise<string[]> {
    try {
      if (!files) return [];

      const fileArray = Array.isArray(files) ? files : [files];

      const uploadPromises = fileArray.map(async (file) => {
        const fileName = `review/${Date.now()}-${file.originalname}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype || `image/${ext}`,
        });

        await this.s3Client.send(command);

        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
      });

      return Promise.all(uploadPromises);
    } catch (err) {
      this.loggerService.warn(`S3/ 업로드 에러: ${err}`);
      throw new InternalServerErrorException();
    }
  }

  private generateReviewKey(originalName: string) {
    const safe = originalName.replace(/[^\w.\-]/g, '_');
    const yyyy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `review/${yyyy}/${Date.now()}-${safe}`;
  }

  async getPresignedPutUrl(originalName: string, contentType: string, ttlSec = 300) {
    if (!this.allowed.includes(contentType)) {
      throw new BadRequestException(`Unsupported contentType: ${contentType}`);
    }

    const key = this.generateReviewKey(originalName);

    const cmd = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      // 기본 private (ACL 생략)
    });
    const url = await getSignedUrl(this.s3Client, cmd, { expiresIn: ttlSec });
    return { url, key, expiresIn: ttlSec };
  }

  async getPresignedGetUrlByKey(key: string, expiresInSec = 180, contentDisposition: string = 'inline'): Promise<string> {
    const isExist = await this.assertObjectExists(key);
    if (!isExist) return null;

    const cmd = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseContentDisposition: contentDisposition,
    });
    return getSignedUrl(this.s3Client, cmd, { expiresIn: expiresInSec });
  }

  /** 존재 확인(선택) */
  async assertObjectExists(key: string) {
    try {
      await this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
    } catch {
      this.loggerService.warn(`S3/ Object Not Found: ${key}`);
      return null;
    }
  }

  async getPresignedPutList(items: { originalName: string; contentType: string }[], ttlSec = 300) {
    const results = await Promise.all(
      items.map(async ({ originalName, contentType }) => {
        if (!this.allowed.includes(contentType)) {
          throw new BadRequestException(`Unsupported contentType: ${contentType}`);
        }

        const key = this.generateReviewKey(originalName);
        return await this.getPresignedPutUrl(key, contentType, ttlSec);
      }),
    );
    return { items: results, ttlSec };
  }

  async deleteImageFromS3(imgKey: string) {
    if (!imgKey || typeof imgKey !== 'string') {
      throw new BadRequestException('Invalid S3 object key');
    }

    try {
      const cmd = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: imgKey,
      });
      await this.s3Client.send(cmd);
    } catch (err) {
      this.loggerService.warn(`S3/ Delete Error (key=${imgKey}): ${err}`);
      throw new InternalServerErrorException('Failed to delete object from S3');
    }
  }
}
