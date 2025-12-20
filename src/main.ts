import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import morgan from "morgan";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["https://time2fest.com"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });

  /**
   * 🔑 PAYPRO IPN
   * This is CRITICAL
   * PayPro sends multipart/form-data
   */
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.setGlobalPrefix("api");

  app.use(morgan("dev"));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
