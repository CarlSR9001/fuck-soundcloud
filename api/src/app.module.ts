import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  storageConfig,
  jwtConfig,
  queueConfig,
} from './config';
import { LoggerMiddleware, BanCheckMiddleware } from './common/middleware';
import {
  HealthModule,
  AuthModule,
  UploadModule,
  TracksModule,
  UsersModule,
  CreditsModule,
  SearchModule,
  AnalyticsModule,
  ReactionsModule,
  CommentsModule,
  ContributionsModule,
  CharitiesModule,
  PaymentsModule,
  VerificationModule,
} from './modules';
import { StorageModule } from './modules/storage';
import { StreamModule } from './modules/stream';
import { TagsModule } from './modules/tags/tags.module';
import { ReportsModule } from './modules/reports';
import { StrikesModule } from './modules/strikes';
import { DmcaModule } from './modules/dmca';
import { RedisModule } from './modules/redis/redis.module';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        storageConfig,
        jwtConfig,
        queueConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config) => config,
      inject: [databaseConfig.KEY],
    }),
    BullModule.forRootAsync({
      useFactory: (config) => ({
        redis: config,
      }),
      inject: [redisConfig.KEY],
    }),
    RedisModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UploadModule,
    TracksModule,
    UsersModule,
    StreamModule,
    CreditsModule,
    TagsModule,
    SearchModule,
    AnalyticsModule,
    ReactionsModule,
    CommentsModule,
    PaymentsModule,
    ContributionsModule,
    CharitiesModule,
    ReportsModule,
    StrikesModule,
    DmcaModule,
    VerificationModule,
    TypeOrmModule.forFeature([User]),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer.apply(BanCheckMiddleware).forRoutes('*');
  }
}
