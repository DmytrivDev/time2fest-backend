import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import morgan from "morgan";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Глобальний префікс ---
  app.setGlobalPrefix("api");

  // --- CORS ---
  app.enableCors({
    origin: ["http://localhost:3000", "https://time2fest.com"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // --- Middleware: логування запитів ---
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
