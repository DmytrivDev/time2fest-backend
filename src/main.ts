import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import morgan from "morgan";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  });

  app.enableCors({
    origin: ["https://time2fest.com"],
    credentials: true,
  });

  /**
   * 🔑 PAYPRO IPN — RAW BODY IS REQUIRED
   */
  app.use(
    bodyParser.urlencoded({
      extended: false,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    })
  );

  // ❗ JSON тільки ПІСЛЯ urlencoded
  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        if (!req.rawBody) {
          req.rawBody = buf.toString("utf8");
        }
      },
    })
  );

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
