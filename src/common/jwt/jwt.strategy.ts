import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../database/entity/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService, // ✅ ConfigService 주입
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      ignoreExpiration: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any) {
    const { uuid, exp, role } = payload;
    if (exp && Date.now() >= exp * 1000) {
      throw new UnauthorizedException('The token has expired.');
    }

    const user: User = await this.userRepository.findOne({ where: { uuid } });
    if (!user) {
      this.loggerService.warn(`JWT/ Not Exist User : ${uuid}`);
      throw new NotFoundException('Not Exist User');
    }
    return { uuid, role };
  }
}
