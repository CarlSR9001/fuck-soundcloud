import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    const { user, access_token } = await this.authService.signup(
      signupDto.email,
      signupDto.handle,
      signupDto.password,
      signupDto.display_name,
    );

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        display_name: user.display_name,
        created_at: user.created_at,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { user, access_token } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        display_name: user.display_name,
        created_at: user.created_at,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.sessionId);
    return { message: 'Logged out successfully' };
  }
}
