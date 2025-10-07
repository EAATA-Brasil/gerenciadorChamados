// dev/backend/src/tickets/tickets.controller.ts (ATUALIZADO)
import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TicketsService } from './tickets.service';
import { CommentsService } from './comments.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as PDFDocument from 'pdfkit';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly commentsService: CommentsService
  ) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('departments')
  getDepartments() {
    return this.ticketsService.getDepartments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(+id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(+id);
  }

  // Endpoints para comentários
  // No tickets.controller.ts, corrija o endpoint de criação de comentários
    @Post(':id/comments')
        async createComment(
        @Param('id') ticketId: string, 
        @Body() createCommentDto: CreateCommentDto
        ) {
        // Validar se o ticket existe
        await this.ticketsService.findOne(+ticketId);
        
        // Criar o DTO correto
        const commentData = {
            ticketId: +ticketId,
            autor: createCommentDto.autor,
            conteudo: createCommentDto.conteudo
        };
        
        return this.commentsService.create(commentData);
    }

  @Get(':id/comments')
  getComments(@Param('id') ticketId: string) {
    return this.commentsService.findByTicketId(+ticketId);
  }

  @Patch('comments/:commentId')
  updateComment(@Param('commentId') commentId: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(+commentId, updateCommentDto);
  }

  @Delete('comments/:commentId')
  removeComment(@Param('commentId') commentId: string) {
    return this.commentsService.remove(+commentId);
  }

  // Upload de imagem
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
      }
      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer['File']) {
    return {
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size
    };
  }

  // Geração de PDF com comentários
  @Get(':id/pdf')
  async generatePDF(@Param('id') id: string, @Res() res: Response) {
    const ticket = await this.ticketsService.findOne(+id);
    
    const doc = new PDFDocument();
    const filename = `ticket-${ticket.id}-${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Título
    doc.fontSize(20).text(`Ticket #${ticket.id}`, 50, 50);
    doc.fontSize(16).text(ticket.title, 50, 80);
    
    // Informações do ticket
    doc.fontSize(12);
    doc.text(`Departamento: ${ticket.department}`, 50, 120);
    doc.text(`Status: ${ticket.status}`, 50, 140);
    doc.text(`Aberto por: ${ticket.openedBy || 'N/A'}`, 50, 160);
    doc.text(`Data de abertura: ${new Date(ticket.createdAt).toLocaleString('pt-BR')}`, 50, 180);
    doc.text(`Última atualização: ${new Date(ticket.updatedAt).toLocaleString('pt-BR')}`, 50, 200);
    
    // Descrição
    doc.text('Descrição:', 50, 240);
    doc.text(ticket.description || 'Sem descrição', 50, 260, { width: 500 });
    
    let yPosition = 320;
    
    // Imagem se existir
    if (ticket.imagePath) {
      try {
        const imagePath = join(process.cwd(), 'uploads', ticket.imagePath.replace('/uploads/', ''));
        if (fs.existsSync(imagePath)) {
          doc.text('Imagem anexada:', 50, yPosition);
          yPosition += 20;
          doc.image(imagePath, 50, yPosition, { width: 300 });
          yPosition += 200;
        }
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
      }
    }
    
    // Comentários
    if (ticket.comments && ticket.comments.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Comentários', 50, 50);
      
      let commentY = 80;
      
      for (const comment of ticket.comments) {
        if (commentY > 700) {
          doc.addPage();
          commentY = 50;
        }
        
        doc.fontSize(12);
        doc.text(`${comment.autor} - ${new Date(comment.createdAt).toLocaleString('pt-BR')}`, 50, commentY);
        commentY += 20;
        doc.text(comment.conteudo, 50, commentY, { width: 500 });
        commentY += 40;
        
        // Linha separadora
        doc.moveTo(50, commentY).lineTo(550, commentY).stroke();
        commentY += 20;
      }
    }
    
    doc.end();
  }

  // Relatório por período
  @Get('report/period')
  async getReportData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.ticketsService.getTicketsForReport(start, end);
  }
}

