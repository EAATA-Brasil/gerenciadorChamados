// src/config/config.controller.ts
import { Controller, Get, Post, Body } from "@nestjs/common";
import * as fs from "fs";
import { ConfigService } from "@nestjs/config";
import { getConfigPath, getEnvPath } from "./config-path";

@Controller("config")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get("db")
  getDbConfig() {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return {
        type: data.type || 'sqlite',
        host: data.host || '',
        port: data.port || '',
        user: data.user || '',
        password: data.password || '',
        name: data.name || ''
      };
    }
    return {
      type: 'sqlite',
      host: '',
      port: '',
      user: '',
      password: '',
      name: ''
    };
  }

  @Post('save-db-config')
  saveDbConfig(@Body() config: any) {
    const configPath = getConfigPath();
    const envPath = getEnvPath();

    // Salva no arquivo config.json em um caminho gravável
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Atualiza o .env (opcional)
    const envContent = [
      `DB_TYPE=${config.type || 'sqlite'}`,
      `DB_HOST=${config.host || ''}`,
      `DB_PORT=${config.port || ''}`,
      `DB_USER=${config.user || ''}`,
      `DB_PASS=${config.password || ''}`,
      `DB_NAME=${config.name || ''}`,
    ].join('\n');

    fs.writeFileSync(envPath, envContent);
    console.log("Reiniciar backend")
    return { success: true };
  }
}
