import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { CreatePresignedDTO, CreatePresignedListDTO } from './dto/requests/create_presigned_url.dto';
import { PreSignedURLListResponsesDTO, PreSignedURLResponsesDTO } from './dto/responses/create_presigned_url_requests.dto';

@Injectable()
export class PresignedUrlService {
  constructor(private readonly awsService: AwsService) {}

  async createPresignedURL(createPresignedDTO: CreatePresignedDTO) {
    const { originalName, contentType, uploadType } = createPresignedDTO;

    const presignedURL = await this.awsService.getPresignedPutUrl(originalName, contentType, uploadType);
    return new PreSignedURLResponsesDTO(presignedURL);
  }

  async createPresignedURLList(createPresignedDTO: CreatePresignedListDTO) {
    const { files, uploadType } = createPresignedDTO;

    const presignedURLList = await this.awsService.getPresignedPutList(files, uploadType);
    return new PreSignedURLListResponsesDTO(presignedURLList);
  }
}
