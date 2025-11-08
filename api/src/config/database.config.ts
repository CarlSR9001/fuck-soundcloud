import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'platform',
  password: process.env.DB_PASSWORD || 'platform',
  database: process.env.DB_NAME || 'platform',
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
  logging: process.env.DB_LOGGING === 'true' || false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
}));
