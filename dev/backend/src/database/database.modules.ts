// src/database/database.module.ts
import { Module, DynamicModule, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Ticket } from '../tickets/ticket.entity';
import { Sector } from '../sectors/sector.entity';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');

@Module({})
export class DatabaseModule {
  private static readonly logger = new Logger(DatabaseModule.name);

  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => {
            // Verifica se existe configuração no config.json
            let dbConfig: any = { type: 'sqlite' };
            if (fs.existsSync(CONFIG_PATH)) {
              const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
                if (fileConfig.type) {
                // Mapeia 'sqlite' para 'better-sqlite3' se for o caso
                  const dbType = fileConfig.type === 'sqlite' ? 'better-sqlite3' : fileConfig.type;
                  dbConfig = {
                    type: dbType,
                    host: fileConfig.host,
                    port: fileConfig.port,
                    username: fileConfig.user,
                    password: fileConfig.password,
                    database: fileConfig.name,
                    synchronize: true,
                    autoLoadEntities: true
                  };
                this.logger.log(`✅ Usando banco ${dbType} configurado via frontend`);
                return dbConfig;
              }
            }

            // Fallback para better-sqlite3
            this.logger.log('✅ Usando better-sqlite3 local (configuração padrão)')
            return {
              type: 'better-sqlite3',
              database: 'database.sqlite',
              entities: [Ticket, Sector],
              synchronize: true,
            };
            
          },
        }),
      ],
    };
  }
}