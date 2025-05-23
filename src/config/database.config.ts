import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { env } from './env.config';

export const databaseCoreConfig: TypeOrmModuleOptions = {
  name: 'default', // важливо: це основне підключення
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database_core,
  synchronize: true, // тільки для розробки!
  autoLoadEntities: true,
};