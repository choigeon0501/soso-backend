import { ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AwsService } from '../../../common/aws/aws.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { User } from '../entities/user.entity';
import { UserWithdrawal } from '../entities/user-withdrawal.entity';
import { WithdrawalReasonCode } from '../const/withdrawal-reason-code.const';
import { ShopSubmitRecord } from '../../shop/entities/shop-submit-user-record.entity';
import { Shop } from '../../shop/entities/shop.entity';
import { ShopProductMapping } from '../../shop/entities/shop-product-mapping.entity';
import { ShopOperatingHour } from '../../shop/entities/shop-operating-hour.entity';
import { SubmitStatus, SubmitType } from '../../shop/const/submit.const';

@Injectable()
export class UserTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly awsService: AwsService,
    private readonly loggerService: LoggerService,
  ) {}

  async updateNickNameAndProfileImage(uuid: string, nickName: string, profileImgKey: string): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepository = manager.getRepository(User);

        const nickNameExists = await userRepository.exists({ where: { nickName } });
        if (nickNameExists) {
          throw new ConflictException('NickName is already in use');
        }

        const result = await userRepository.update({ uuid }, { nickName, profileImg: profileImgKey });
        if (result.affected === 0) {
          throw new NotFoundException('User not found');
        }
      });
    } catch (err) {
      /** 동시에 같은 닉네임을 잡으면 users.nickname 유니크 제약이 막는다. */
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('NickName is already in use');
      }
      if (err instanceof HttpException) throw err;
      this.loggerService.logError('UserTransaction/ updateNickNameAndProfileImage Error', err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * 승인되지 않은 제보 데이터를 지우고, 탈퇴 기록을 남긴 뒤 유저를 하드 삭제한다.
   * 승인된 제보는 운영 데이터가 됐으므로 남긴다.
   */
  async withdrawUser(user: User, withdrawalReasonCode: WithdrawalReasonCode): Promise<void> {
    const { uuid, profileImg } = user;

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepository = manager.getRepository(User);

        const submitRecords = await manager
          .getRepository(ShopSubmitRecord)
          .find({ where: { user: { uuid } }, relations: ['shop', 'shopOperatingHour'] });
        for (const record of submitRecords) {
          if (record.status === SubmitStatus.Approved) continue;

          switch (record.type) {
            case SubmitType.NewShop:
              await manager.getRepository(Shop).delete({ id: record.shop.id });
              break;
            case SubmitType.NewOperating:
              await manager.getRepository(ShopOperatingHour).delete({ id: record.shopOperatingHour.id });
              break;
            case SubmitType.NewProduct:
              await manager.getRepository(ShopProductMapping).delete({ submitRecord: { id: record.id } });
              break;
            default:
              this.loggerService.logError('User/ deleteUser Error', { userSubmitRecord: record, message: 'type is not supported' });
          }
        }

        if (profileImg) {
          await this.awsService.deleteImageFromS3(profileImg);
        }

        const savedUser = await userRepository.findOne({ where: { uuid } });
        await manager.getRepository(UserWithdrawal).save({ uuid: savedUser.uuid, nickName: savedUser.nickName, reasonCode: withdrawalReasonCode });
        await userRepository.delete({ uuid });
      });
    } catch (err) {
      this.loggerService.logError('UserTransaction/ withdrawUser Error', err);
      throw new InternalServerErrorException();
    }
  }
}
