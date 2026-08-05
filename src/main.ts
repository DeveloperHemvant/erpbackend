import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as express from "express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase request body size limit
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve uploaded images (events, announcements, ...) back out as static files.
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads/" });

  // Enable Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("School ERP Backend Engine")
    .setDescription(
      "Secure REST APIs managing Roles, Staff Access Lists, Audit Logging, and Geofenced Biometric Check-ins.",
    )
    .setVersion("1.0.0")
    .addTag("Authentication Portal")
    .addTag("Role Settings")
    .addTag("Staff Onboarding")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`Backend Engine running on http://localhost:${port}`);
}
bootstrap();
