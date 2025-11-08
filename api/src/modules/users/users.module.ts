import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, Asset } from '../../entities';
import { StorageModule } from '../storage';
import { AuthModule } from '../auth/auth.module';
import { ReactionsModule } from '../reactions/reactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Asset]),
    StorageModule,
    AuthModule,
    forwardRef(() => ReactionsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
