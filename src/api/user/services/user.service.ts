import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AwsService } from '../../../common/aws/aws.service';
import { UserRepository } from '../repositories/user.repository';
import { UserWithdrawalRepository } from '../repositories/user-withdrawal.repository';
import { UserTransactionService } from './user-transaction.service';
import { AuthService } from '../../auth/services/auth.service';
import { UpdateUserProfileDto } from '../dto/request/update-user-profile.dto';
import { WithdrawUserQueryDto } from '../dto/query/withdraw-user-query.dto';
import { CheckNicknameQueryDto } from '../dto/query/check-nickname-query.dto';
import { GetUsersQueryDto } from '../dto/query/get-users-query.dto';
import { GetUserProfileResponseDto } from '../dto/response/get-user-profile-response.dto';
import { ActivityUserResponseDto, WithdrawalUserResponseDto } from '../dto/response/get-all-users-response.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userWithdrawalRepository: UserWithdrawalRepository,
    private readonly userTransactionService: UserTransactionService,
    private readonly authService: AuthService,
    private readonly awsService: AwsService,
  ) {}

  async getUserProfile(uuid: string): Promise<GetUserProfileResponseDto> {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    const authIdentity = await this.authService.findAuthIdentityByUuid(uuid);
    if (!authIdentity) {
      throw new NotFoundException('Not Found User');
    }

    return { email: user.email, profileImg: user.profileImg, nickName: user.nickName, provider: authIdentity.provider };
  }

  /**
   * 닉네임과 이미지 키가 함께 오면 한 트랜잭션으로 바꾸고 업로드 파일은 무시한다.
   */
  async updateUserProfile(body: UpdateUserProfileDto, file: Express.Multer.File | undefined, uuid: string): Promise<void> {
    const { nickName, profileImgKey } = body;

    if (nickName && profileImgKey) {
      await this.userTransactionService.updateNickNameAndProfileImage(uuid, nickName, profileImgKey);
      return;
    }

    if (nickName) {
      const nickNameExists = await this.userRepository.existsByNickName(nickName);
      if (nickNameExists) {
        throw new ConflictException('Nickname already exists.');
      }

      const result = await this.userRepository.updateNickName(uuid, nickName);
      if (result.affected == 0) {
        throw new NotFoundException('Fail update nickname');
      }
    }

    if (file) {
      const [profileImg] = await this.awsService.uploadImagesToS3(file, 'user-profile');
      const user = await this.userRepository.findByUuid(uuid);
      await this.awsService.deleteImageFromS3(user.profileImg);
      user.profileImg = profileImg;
      await this.userRepository.save(user);
    }
  }

  async withdrawUser(query: WithdrawUserQueryDto, uuid: string): Promise<void> {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('Not Found User');
    }

    await this.userTransactionService.withdrawUser(user, query.withdrawalReasonCode);
  }

  async existsNickName(query: CheckNicknameQueryDto): Promise<boolean> {
    return this.userRepository.existsByNickName(query.nickName);
  }

  async findAllUsersForAdmin(query: GetUsersQueryDto): Promise<ActivityUserResponseDto[] | WithdrawalUserResponseDto[]> {
    const active = query.active !== false;
    const order = (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC';
    const orderKey = query.sortBy === 'lastActiveAt' ? 'lastActivityAt' : 'createdAt';

    if (active) {
      const users = await this.userRepository.findAllWithAuthIdentities(orderKey, order);

      return users.map((user, index) => ({
        num: index + 1,
        email: user.email,
        nickName: user.nickName,
        createdAt: user.createdAt,
        lastActivityAt: user.lastActivityAt,
        provider: user.authIdentities?.[0]?.provider ?? null,
      }));
    }

    const withdrawals = await this.userWithdrawalRepository.findAll(order);

    return withdrawals.map((withdrawal, index) => ({
      num: index + 1,
      uuid: withdrawal.uuid,
      nickName: withdrawal.nickName,
      createdAt: withdrawal.createdAt,
      withdrawalReason: withdrawal.reasonCode,
    }));
  }
}
