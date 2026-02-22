import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AdminUser } from '../../api/admin/entities/admin-user.entity';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  'admin-jwt', // ⭐ 전략 이름 중요
) {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepository: Repository<AdminUser>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ADMIN_TOKEN_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const { sub } = payload;

    const admin = await this.adminRepository.findOne({
      where: { id: sub },
    });
    if (!admin) {
      throw new ForbiddenException();
    }

    return {
      adminId: admin.id,
    };
  }
}
