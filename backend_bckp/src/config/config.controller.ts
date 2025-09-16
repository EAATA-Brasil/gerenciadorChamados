// src/config/config.controller.ts
import { Controller, Get, Post, Body } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "@nestjs/config";

const CONFIG_PATH = path.join(__dirname, "..", "..", "config.json");

@Controller("config")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get("db")
  getDbConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
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
    // Salva no arquivo config.json
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    // Atualiza o .env (opcional)
    fs.writeFileSync('.env', `
      DB_TYPE=${config.type || 'sqlite'}
      DB_HOST=${config.host || ''}
      DB_PORT=${config.port || ''}
      DB_USER=${config.user || ''}
      DB_PASS=${config.password || ''}
      DB_NAME=${config.name || ''}
    `);
    console.log("Reiniciar backend")
    return { success: true };
  }
}