import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import morgan from "morgan";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CORS ---
  app.enableCors({
    origin: ["https://time2fest.com"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });

  /**
   * 🔑 PAYPRO IPN
   * PayPro sends application/x-www-form-urlencoded
   * This parser is MANDATORY
   */
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // --- Global prefix ---
  app.setGlobalPrefix("api");

  // --- Logging ---
  app.use(morgan("dev"));

  // --- Validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
