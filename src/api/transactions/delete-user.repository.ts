import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../database/entity/user.entity';
import { LoggerService } from '../logger/logger.service';
import { Image } from '../../database/entity/image.entity';
import { UserWithdrawal } from '../../database/entity/user-withdrawal.entity';
import { WithdrawalReasonDTO } from '../user/dto/query/user.dto';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class DeleteUserTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private awsService: AwsService,
    private loggerService: LoggerService,
  ) {}

  async deleteUser(user: User, withdrawalReason: WithdrawalReasonDTO): Promise<void> {
    const { uuid, profileImg } = user;
    const { withdrawalReasonCode, withdrawalReasonText } = withdrawalReason;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const userWithdrawalRepo = queryRunner.manager.getRepository(UserWithdrawal);
      const imgRepo = queryRunner.manager.getRepository(Image);

      await imgRepo.delete({ fileKey: profileImg });
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
