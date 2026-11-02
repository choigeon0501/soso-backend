import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';
import { WithdrawalReasonDTO } from '../dto/query/user.dto';
import { AwsService } from '../../../common/aws/aws.service';
import { ShopSubmitRecord } from '../../shop/entities/shop-submit-user-record.entity';
import { SubmitStatus } from '../../shop/const/submit.const';
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

      // 2. 승인되지 않은 제보 데이터들은 전부 삭제
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
              this.loggerService.logError('User/ deleteUser Error', {
                userSubmitRecord,
                message: 'type is not supported',
              });
          }
        }
      }

      // 3. 유저 프로필은 존재시 삭제
      if (profileImg) await this.awsService.deleteImageFromS3(profileImg);

      // 4. 유저 정보 불러오기
      const user = await userRepo.findOne({ where: { uuid } });

      // 5. 탈퇴 데이터 저장
      await userWithdrawalRepo.save({
        uuid: user.uuid,
        nickName: user.nickName,
        reasonCode: withdrawalReasonCode,
      });

      // 6. 유저 하드 딜리트
      await userRepo.delete({ uuid });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
