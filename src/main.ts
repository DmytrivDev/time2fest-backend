import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3001',
    credentials: true, // якщо будеш передавати куки/токени
  });

  await app.listen(3000);
}
bootstrap();