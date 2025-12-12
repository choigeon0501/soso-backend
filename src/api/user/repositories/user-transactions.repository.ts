import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';
import { WithdrawalReasonDTO } from '../dto/query/user.dto';
import { AwsService } from '../../../common/aws/aws.service';
import { ShopSubmitRecord } from '../../shop/entities/shop-submit-user-record.entity';
import { SubmitStatus } from '../../../common/enum/role.enum';
import { Shop } from '../../shop/entities/shop.entity';
import { ShopProductMapping } from '../../shop/entities/shop-product-mapping.entity';
import { ShopOperatingHour } from '../../shop/entities/shop-operating-hour.entity';

@Injectable()
export class UserTransactionsRepository {
  constructor(
    private dataSource: DataSource,
    private awsService: AwsService,
    private loggerService: LoggerService,
  ) {}

  async updateUser(nickName: string, profileImgKey: string, uuid: string): Promise<void> {
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
    const { withdrawalReasonCode } = withdrawalReason;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const shopRepo = queryRunner.manager.getRepository(Shop);
      const shopOperatingRepo = queryRunner.manager.getRepository(ShopOperatingHour);
      const shopProductRepo = queryRunner.manager.getRepository(ShopProductMapping);
      const userSubmitRepo = queryRunner.manager.getRepository(ShopSubmitRecord);
      const userWithdrawalRepo = queryRunner.manager.getRepository(UserWithdrawal);

      // 1. 유저가 제보한 소품샵 데이터들 조회.
      const userSubmitRecords = await userSubmitRepo.find({ where: { user: { uuid } }, relations: ['shop', 'shopOperatingHour'] });

      // 2. 만약 제보한 내용이 소품샵이라면, 해당 제보의 status 체크 후 실제 사용 중인 데이터이면 냅두기 (approved)
      for (const userSubmitRecord of userSubmitRecords) {
        if (userSubmitRecord.status !== SubmitStatus.Approved) {
          switch (userSubmitRecord.type) {
            case 'new_shop':
              await shopRepo.delete({ id: userSubmitRecord.shop.id });
              break;
            case 'new_operating':
              await shopOperatingRepo.delete({ id: userSubmitRecord.shopOperatingHour.id });
              break;
            case 'new_product':
              await shopProductRepo.delete({ submitRecord: { id: userSubmitRecord.id } });
              break;
            default:
              this.loggerService.warn(`User/ deleteUser Error: ${userSubmitRecord.type} is not supported type`);
          }
        }
      }

      if (profileImg) await this.awsService.deleteImageFromS3(profileImg); // 유저 프로필은 삭제하기!

      await userWithdrawalRepo.save({
        reasonCode: withdrawalReasonCode,
      });
      await userRepo.delete({ uuid });

      await queryRunner.commitTransaction();
    } catch (err) {
      this.loggerService.error(`User/ deleteUser Error: ${err}`);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
