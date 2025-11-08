/**
 * TypeORM DataSource configuration for worker service
 * Connects to PostgreSQL and loads all entities from api/src/entities
 */

import { DataSource } from 'typeorm';
import { loadDatabaseConfig } from './database.config';
import {
  User,
  Session,
  Asset,
  Track,
  TrackVersion,
  Transcode,
  Waveform,
} from '../../../api/src/entities';

let dataSource: DataSource | null = null;

/**
 * Create and initialize TypeORM DataSource
 */
export async function createDataSource(): Promise<DataSource> {
  const config = loadDatabaseConfig();

  const ds = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    entities: [User, Session, Asset, Track, TrackVersion, Transcode, Waveform],
    synchronize: false, // Never auto-sync in production
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    maxQueryExecutionTime: 5000, // Log slow queries (5s+)
  });

  await ds.initialize();
  dataSource = ds;

  console.log('TypeORM DataSource initialized');
  return ds;
}

/**
 * Get active DataSource instance
 * Throws if not initialized
 */
export function getDataSource(): DataSource {
  if (!dataSource || !dataSource.isInitialized) {
    throw new Error('DataSource not initialized. Call createDataSource() first.');
  }
  return dataSource;
}

/**
 * Close DataSource connection
 */
export async function closeDataSource(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
    console.log('TypeORM DataSource closed');
  }
}
