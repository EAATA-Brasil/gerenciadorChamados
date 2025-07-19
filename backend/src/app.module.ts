import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketsModule } from './tickets/tickets.module';
import { UploadController } from './uploads/upload.controller';
import { ReportController } from './report/report.controller';

@Module({
  imports: [TicketsModule],
  controllers: [AppController, UploadController, ReportController],
  providers: [AppService],
})
export class AppModule {}
