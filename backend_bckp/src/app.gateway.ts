import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // ✅ necessário para permitir Electron e qualquer frontend
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log('✅ Cliente conectado:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Cliente desconectado:', client.id);
  }

  notifyNewCall(call: any) {
    console.log('📢 Emitindo nova chamada para os clientes WS');
    this.server.emit('nova_chamada', call);
  }

  afterInit(server: any) {
      console.log("Servidor WS Iniciado");
  }
}
//http://82.25.71.76/helpdesk/