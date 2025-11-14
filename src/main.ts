import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import morgan from "morgan";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CORS ---
  app.enableCors({
    origin: ["http://localhost:3000", "https://time2fest.com"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // 🚨 MUST HAVE for Paddle webhooks:
  // Зберігаємо сирий body перед JSON парсингом
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );

  // --- Global prefix ---
  app.setGlobalPrefix("api");

  // --- Logging ---
  app.use(morgan("dev"));

  // --- ValidationPipe ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
