import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database_core: process.env.DB_NAME,
  },
};