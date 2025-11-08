import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':handle')
  async findByHandle(@Param('handle') handle: string) {
    // UNIMPLEMENTED: User profile retrieval will be implemented by business logic agent
    return { message: 'UNIMPLEMENTED: get user by handle endpoint' };
  }
}
