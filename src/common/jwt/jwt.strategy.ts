import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../api/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      ignoreExpiration: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any) {
    const { sub, exp, role } = payload;
    if (exp && Date.now() >= exp * 1000) {
      throw new UnauthorizedException('The token has expired.');
    }

    const user: User = await this.userRepository.findOne({ where: { uuid: sub } });
    if (!user) {
      throw new NotFoundException('Not Exist User');
    }

    /** lastActivityAt은 10분 간격으로만 갱신해 요청마다 쓰기가 일어나지 않게 한다. */
    const now = Date.now();
    const lastActivityTime = user.lastActivityAt?.getTime() ?? 0;
    if (now - lastActivityTime > 10 * 60 * 1000) {
      user.lastActivityAt = new Date();
      await this.userRepository.save(user);
    }

    return { sub, role };
  }
}
