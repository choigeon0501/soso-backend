import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async saveUser(user: User) {
    return await this.userRepository.save(user);
  }

  async findUserByUUID(uuid: string) {
    return await this.userRepository.findOne({
      where: {
        uuid: uuid,
      },
    });
  }

  async findUserByNickName(nickName: string) {
    return await this.userRepository.findOne({ where: { nickName } });
  }

  async updateNickName(uuid: string, nickName: string) {
    return await this.userRepository.update({ uuid }, { nickName });
  }

  async findActivityUsers(orderKey: 'createdAt' | 'lastActivityAt', order: 'ASC' | 'DESC') {
    return await this.userRepository.find({
      relations: ['authIdentities'],
      order: { [orderKey]: order },
    });
  }
}
