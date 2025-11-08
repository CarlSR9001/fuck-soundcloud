import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';
import { ReactionsService } from '../reactions/reactions.service';

@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ReactionsService))
    private readonly reactionsService: ReactionsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@User('userId') userId: string) {
    return await this.usersService.getUserById(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @User('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.usersService.updateProfile(userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @User('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.usersService.uploadAvatar(userId, file);
  }

  @Get(':handle')
  async getUserProfile(@Param('handle') handle: string) {
    return await this.usersService.getUserByHandle(handle);
  }

  @Get(':handle/followers')
  async getFollowers(@Param('handle') handle: string) {
    const user = await this.usersService.getUserByHandle(handle);
    return await this.reactionsService.getFollowers(user.id);
  }

  @Get(':handle/following')
  async getFollowing(@Param('handle') handle: string) {
    const user = await this.usersService.getUserByHandle(handle);
    return await this.reactionsService.getFollowing(user.id);
  }
}
