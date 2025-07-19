import { Controller, Delete, Post, UploadedFile, UseInterceptors, Param, Res, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  uploadImage(@UploadedFile() file: any) { // ✅ CORRETO
    return {
      url: `http://localhost:3000/uploads/${file.filename}`,
    };
  }

  @Delete('image/:filename')
  deleteImage(@Param('filename') filename: string, @Res() res) {
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!filename) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Nome do arquivo não fornecido.' });
    }

    if (!existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Arquivo não encontrado.' });
    }

    try {
      unlinkSync(filePath);
      return res.status(HttpStatus.OK).json({ message: 'Arquivo removido com sucesso.' });
    } catch (error) {
      console.error(`Erro ao remover o arquivo ${filename}:`, error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro ao remover o arquivo.', error: error.message });
    }
  }
}

