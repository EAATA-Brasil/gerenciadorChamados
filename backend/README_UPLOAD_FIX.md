# Correção do Sistema de Upload de Imagens

## Problema Resolvido

O sistema de upload estava retornando URLs com `localhost` hardcoded, o que impedia o acesso às imagens quando o frontend e backend estavam em máquinas diferentes.

## Solução Implementada

### 1. Detecção Automática da URL Base

O controller de upload agora detecta automaticamente a URL base do servidor usando:

- **Protocol**: Detecta se é HTTP ou HTTPS baseado no header `x-forwarded-proto` ou na propriedade `req.secure`
- **Host**: Usa o header `Host` da requisição para obter o domínio e porta
- **Fallback**: Permite override via variável de ambiente `BASE_URL`

### 2. Resposta Melhorada

O endpoint de upload agora retorna mais informações:

```json
{
  "url": "https://meudominio.com/uploads/1234567890-123456789.jpg",
  "filename": "1234567890-123456789.jpg", 
  "originalname": "foto.jpg",
  "size": 1024000
}
```

### 3. Configuração Flexível

Criado arquivo `.env.example` com as configurações disponíveis:

- `BASE_URL`: URL base opcional para override manual
- `PORT`: Porta do servidor (padrão: 3000)

## Como Usar

### Desenvolvimento Local
```bash
# Não precisa configurar nada, funciona automaticamente
npm run start:dev
```

### Produção
```bash
# Opcional: definir URL base manualmente
export BASE_URL=https://meudominio.com
export PORT=3000

npm run start:prod
```

### Docker/Deploy
```bash
# A detecção automática funciona com proxies reversos
# que passam os headers corretos (nginx, traefik, etc.)
```

## Compatibilidade

- ✅ Desenvolvimento local (localhost)
- ✅ Servidores remotos
- ✅ Proxies reversos (nginx, traefik)
- ✅ HTTPS/HTTP automático
- ✅ Diferentes portas
- ✅ Subdomínios

## Migração

Não há breaking changes. O sistema continua funcionando exatamente igual, mas agora as URLs são geradas corretamente para qualquer ambiente.

## Exemplo de Uso no Frontend

```javascript
// Upload de arquivo
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/upload/image', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('URL da imagem:', result.url);

// A URL agora será algo como:
// http://192.168.1.100:3000/uploads/1234567890-123456789.jpg
// ou
// https://meudominio.com/uploads/1234567890-123456789.jpg
```

