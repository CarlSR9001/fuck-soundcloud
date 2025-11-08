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
import { LoggerMiddleware } from './common/middleware';
import {
  HealthModule,
  AuthModule,
  UploadModule,
  TracksModule,
  UsersModule,
} from './modules';

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
    HealthModule,
    AuthModule,
    UploadModule,
    TracksModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
