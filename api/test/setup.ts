import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

/**
 * Test database configuration
 */
export const getTestDatabaseConfig = () => ({
  type: 'postgres' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER || 'test',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'platform_test',
  entities: ['src/**/*.entity.ts'],
  synchronize: true, // Only for tests
  dropSchema: true, // Clean slate for each test run
});

/**
 * Test MinIO configuration
 */
export const getTestMinioConfig = () => ({
  endpoint: process.env.TEST_MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.TEST_MINIO_PORT || '9000'),
  useSSL: process.env.TEST_MINIO_USE_SSL === 'true',
  accessKey: process.env.TEST_MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.TEST_MINIO_SECRET_KEY || 'minioadmin',
});

/**
 * Test Redis configuration
 */
export const getTestRedisConfig = () => ({
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  db: parseInt(process.env.TEST_REDIS_DB || '1'), // Use separate DB for tests
});

/**
 * Create test application instance
 */
export async function createTestApp(
  imports: any[],
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot(getTestDatabaseConfig()),
      ...imports,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

/**
 * Close test application and cleanup
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}

/**
 * Generate random test data
 */
export const testHelpers = {
  randomEmail: () => `test-${Date.now()}@example.com`,
  randomUsername: () => `user_${Date.now()}`,
  randomString: (length = 10) =>
    Math.random().toString(36).substring(2, length + 2),
  randomUUID: () => {
    const uuid = require('uuid');
    return uuid.v4();
  },
};
