import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { env } from './env.config';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: true, // ❗ Тільки для дев-режиму
  autoLoadEntities: true,
};
