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
import * as express from 'express';
import * as fs from "fs";
import { getConfigPath } from './config/config-path';

/**
 * Função para iniciar o servidor em uma porta livre.
 */
async function startApp(app: NestExpressApplication, port: number, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await app.listen(port, '0.0.0.0');
      console.log(`✅ Aplicação rodando em: http://localhost:${port}`);
      return;
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Porta ${port} já em uso, tentando ${port + 1}...`);
        port++;
      } else {
        throw err;
      }
    }
  }
  throw new Error("❌ Não foi possível encontrar uma porta disponível.");
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*', // URL do frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Pasta de uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.useGlobalPipes(new ValidationPipe());

  // Porta inicial da env ou 3000
  const initialPort = parseInt(process.env.PORT ?? '3000', 10);

  await startApp(app, initialPort);
}
bootstrap();

export function getDatabaseUrl(): string {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (data.dbUrl) return data.dbUrl;
  }
  return "sqlite://./data.sqlite"; // padrão
}
