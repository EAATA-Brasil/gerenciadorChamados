import { Injectable } from '@nestjs/common';
import { AppGateway } from './app.gateway';

@Injectable()
export class AppService {
  constructor(private readonly gateway: AppGateway) {}

  getHello(): string {
    // 🔔 Dispara um evento WS de teste
    this.gateway.notifyNewCall({
      title: 'Nova solicitação de suporte',
      department: 'TI',
    });

    return 'Hello World!';
  }
}
