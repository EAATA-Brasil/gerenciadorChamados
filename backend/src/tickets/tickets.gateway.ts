import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // permite qualquer origem (ajuste em produção)
  },
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('🔌 Cliente conectado:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('❌ Cliente desconectado:', client.id);
  }

  // Envia um evento para todos os clientes conectados
  notifyNewTicket(ticket: any) {
    this.server.emit('new_ticket', ticket);
  }
}
