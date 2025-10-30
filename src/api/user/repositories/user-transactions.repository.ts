import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { ReviewImage } from '../../review/entities/review-image.entity';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';
import { WithdrawalReasonDTO } from '../dto/query/user.dto';
import { AwsService } from '../../../common/aws/aws.service';

@Injectable()
export class UserTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private awsService: AwsService,
    private loggerService: LoggerService,
  ) {}

  async updateUser(nickName: string, profileImgKey: string, uuid: string): Promise<void> {
    await this.awsService.assertObjectExists(profileImgKey);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const existNickName = await userRepo.findOne({ where: { nickName } });
      if (existNickName) {
        throw new ConflictException('NickName is already in use');
      }

      const result = await userRepo.update({ uuid }, { nickName, profileImg: profileImgKey });
      if (result.affected === 0) {
        throw new NotFoundException('User not found');
      }

      await queryRunner.commitTransaction();

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();

      // 4) DB 고유 제약 위반 매핑(MySQL: ER_DUP_ENTRY)
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('NickName is already in use');
      }
      if (err instanceof HttpException) throw err;

      this.loggerService.warn(`User/updateUser Error: ${err?.message ?? err}`);
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteUser(user: User, withdrawalReason: WithdrawalReasonDTO): Promise<void> {
    const { uuid, profileImg } = user;
    const { withdrawalReasonCode, withdrawalReasonText } = withdrawalReason;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const userWithdrawalRepo = queryRunner.manager.getRepository(UserWithdrawal);
      const reviewImgRepo = queryRunner.manager.getRepository(ReviewImage);

      await reviewImgRepo.delete({ fileKey: profileImg });
      await this.awsService.deleteImageFromS3(profileImg);

      await userWithdrawalRepo.save({
        reasonCode: withdrawalReasonCode,
        reasonText: withdrawalReasonText,
      });
      await userRepo.delete({ uuid });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.warn(`User/ deleteUser Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
