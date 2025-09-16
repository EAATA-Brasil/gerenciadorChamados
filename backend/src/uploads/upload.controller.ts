import { 
  Controller, Delete, Post, Get, UploadedFile, UseInterceptors, 
  Param, Res, HttpStatus, Req 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { Request, Response } from 'express';
import * as os from 'os';
import { ConfigService } from '@nestjs/config';

function resolveUploadsPath(configService: ConfigService): string {
  const envDir = configService.get<string>('UPLOAD_DIR');
  if (envDir) {
    if (!existsSync(envDir)) mkdirSync(envDir, { recursive: true });
    return envDir;
  }

  let uploadPath: string;
  switch (process.platform) {
    case 'win32':
      uploadPath = join(process.env.PROGRAMDATA || join(os.homedir(), 'AppData', 'Local'), 'helpdesk', 'uploads');
      break;
    case 'linux':
      uploadPath = '/var/lib/helpdesk/uploads';
      break;
    case 'darwin':
      uploadPath = join(os.homedir(), 'Library', 'Application Support', 'helpdesk', 'uploads');
      break;
    default:
      uploadPath = join(os.homedir(), 'helpdesk', 'uploads');
  }

  if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
  return uploadPath;
}

@Controller('upload')
export class UploadController {
  private uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = resolveUploadsPath(configService);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => cb(null, resolveUploadsPath(new ConfigService())), // garantir criação
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  uploadImage(@UploadedFile() file: any, @Req() req: Request) {
    const baseUrl = this.configService.get<string>('BASE_URL') 
      || `${req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}`;

    return {
      url: `${baseUrl}upload/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
    };
  }

  @Delete('image/:filename')
  deleteImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(this.uploadPath, filename);

    if (!existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Arquivo não encontrado.' });
    }

    try {
      unlinkSync(filePath);
      return res.status(HttpStatus.OK).json({ message: 'Arquivo removido com sucesso.' });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao remover o arquivo.', error: error.message });
    }
  }

  @Get('uploads/:filename')
  getImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(this.uploadPath, filename);
    if (!existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Arquivo não encontrado.' });
    }

    const ext = extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    return res.sendFile(filePath);
  }
}
