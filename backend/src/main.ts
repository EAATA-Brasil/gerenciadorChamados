import * as nodeCrypto from 'crypto';

if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => nodeCrypto.randomUUID()
  };
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express'
import * as fs from "fs";


const CONFIG_PATH = join(__dirname, "..", "config.json");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173', // URL do frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));


  app.useGlobalPipes(new ValidationPipe())
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Aplicação rodando em: http://localhost:${process.env.PORT ?? 3000}`)
}
bootstrap();


export function getDatabaseUrl(): string {
  if (fs.existsSync(CONFIG_PATH)) {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    if (data.dbUrl) return data.dbUrl;
  }
  return "sqlite://./data.sqlite"; // padrão
}