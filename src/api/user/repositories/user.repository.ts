import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByUuid(uuid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { uuid } });
  }

  async existsByNickName(nickName: string): Promise<boolean> {
    return this.userRepository.exists({ where: { nickName } });
  }

  async findAllWithAuthIdentities(orderKey: 'createdAt' | 'lastActivityAt', order: 'ASC' | 'DESC'): Promise<User[]> {
    return this.userRepository.find({ relations: ['authIdentities'], order: { [orderKey]: order } });
  }

  async updateNickName(uuid: string, nickName: string): Promise<UpdateResult> {
    return this.userRepository.update({ uuid }, { nickName });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
