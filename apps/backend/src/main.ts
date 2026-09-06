import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(
    session({
      // ponytail: MemoryStore — lost on restart / won't share across replicas; use Redis if we scale
      secret: process.env.SESSION_SECRET ?? 'dev-only-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
