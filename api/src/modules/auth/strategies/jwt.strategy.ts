import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigType } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import jwtConfig from '../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConf.secret,
    });
  }

  async validate(payload: any) {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.authService.validateSession(payload.jti);

    if (!user) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    return {
      userId: user.id,
      email: user.email,
      handle: user.handle,
      sessionId: payload.sessionId,
      jti: payload.jti,
    };
  }
}
