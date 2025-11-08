import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/user.entity';
import { Session } from '../../entities/session.entity';
import jwtConfig from '../../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  async signup(
    email: string,
    handle: string,
    password: string,
    displayName: string,
  ): Promise<{ user: User; access_token: string }> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { handle }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Handle already taken');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      email,
      handle,
      password_hash: passwordHash,
      display_name: displayName,
    });

    await this.userRepository.save(user);

    const { session, access_token } = await this.createSession(user.id);

    return { user, access_token };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; access_token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { session, access_token } = await this.createSession(user.id);

    return { user, access_token };
  }

  async logout(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionRepository.remove(session);
  }

  async validateSession(jwtId: string): Promise<User | null> {
    const session = await this.sessionRepository.findOne({
      where: { jwt_id: jwtId },
      relations: ['user'],
    });

    if (!session) {
      return null;
    }

    if (new Date() > session.expires_at) {
      await this.sessionRepository.remove(session);
      return null;
    }

    return session.user;
  }

  private async createSession(
    userId: string,
  ): Promise<{ session: Session; access_token: string }> {
    const jwtId = uuidv4();
    const expiresIn = this.jwtConf.expiresIn;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = this.sessionRepository.create({
      user_id: userId,
      jwt_id: jwtId,
      expires_at: expiresAt,
    });

    await this.sessionRepository.save(session);

    const payload = {
      userId,
      sessionId: session.id,
      jti: jwtId,
    };

    const access_token = this.jwtService.sign(payload);

    return { session, access_token };
  }
}
