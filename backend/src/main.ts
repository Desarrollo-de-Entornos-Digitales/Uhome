import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();