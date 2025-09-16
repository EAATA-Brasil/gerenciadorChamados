// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketsModule } from './tickets/tickets.module';
import { UploadController } from './uploads/upload.controller';
import { ReportController } from './report/report.controller';
import { DatabaseModule } from './database/database.modules';
import { ConfigController } from './config/config.controller';
import { ConfigModule } from '@nestjs/config';
import { AppGateway } from './app.gateway';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration]
    }),
    DatabaseModule.forRoot(),
    TicketsModule,
  ],
  controllers: [AppController, UploadController, ReportController, ConfigController],
  providers: [AppService, AppGateway],
})
export class AppModule {}