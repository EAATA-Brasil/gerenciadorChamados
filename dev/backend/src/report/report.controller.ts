import { Body, Controller, Post, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import PDFKit = require('pdfkit');
import SVGToPDF = require('svg-to-pdfkit');

@Controller('report')
export class ReportController {
  @Post('generate-pdf')
  async generatePdf(@Body() body: any, @Res() res: Response) {
    try {
      const { reportData, reportType, startDate, endDate } = body;

      if (!reportData || !reportData.metrics || !reportData.tickets) {
        throw new HttpException('❌ Dados do relatório incompletos', HttpStatus.BAD_REQUEST);
      }

      const fileName = `relatorio-${reportType || 'custom'}-${startDate}-${endDate}.pdf`;
      const doc = new PDFKit({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true // Permite controle avançado das páginas
      });

      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);

      // Página 1 - Capa e Resumo Executivo
      this.addCoverPage(doc, reportData, startDate, endDate);
      this.addExecutiveSummary(doc, reportData);

      // Páginas separadas para cada setor
      const departments = ['Comercial', 'Marketing', 'Financeiro'];
      departments.forEach(dept => {
        doc.addPage(); // Nova página para cada setor
        this.addDepartmentPage(doc, reportData, dept);
      });

      doc.end();
    } catch (err) {
      console.error('❌ ERRO AO GERAR PDF:', err);
      throw new HttpException('Erro ao gerar PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private addCoverPage(doc: PDFKit.PDFDocument, reportData: any, startDate: string, endDate: string) {
    // Fundo colorido para a capa
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill('#f8f9fa');
    
    // Logo da empresa (centralizado)
    // doc.image('logo.png', doc.page.width/2 - 50, 100, { width: 100 });
    
    // Título do relatório
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .text(reportData.title || 'Relatório de Tickets', doc.page.width/2, 200, {
         align: 'center'
       });
    
    // Período
    doc.fontSize(16)
       .fillColor('#7f8c8d')
       .text(`Período: ${startDate} à ${endDate}`, doc.page.width/2, 250, {
         align: 'center'
       });
    
    // Data de geração
    doc.fontSize(12)
       .fillColor('#95a5a6')
       .text(`Gerado em: ${new Date().toLocaleDateString()}`, doc.page.width/2, 300, {
         align: 'center'
       });
    
  }

  private addExecutiveSummary(doc: PDFKit.PDFDocument, reportData: any) {
    doc.addPage() // Página 2 - Resumo Executivo
       .fillColor('#333333');
    
    // Título da seção
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .text('Resumo Executivo', { underline: true });
    
    doc.moveDown();

    // Métricas principais
    
    const totalTickets = reportData.metrics.total;
    const completedOnTime = reportData.metrics.completedOnTime || 0;
    const overdue = reportData.metrics.overdue || 0;
    const completionRate = totalTickets > 0 ? Math.round((completedOnTime / totalTickets) * 100) : 0;
    
    doc.fontSize(12)
       .fillColor('#333333')
       .text('Métricas Gerais:', { underline: true })
       .moveDown(0.5);
    
    doc.list([
      `Total de chamados: ${totalTickets}`,
      `Concluídos dentro do prazo: ${completedOnTime} (${completionRate}%)`,
      `Em atraso: ${overdue}`,
      `Taxa de resolução: ${completionRate}%`
    ], { listType: 'numbered' });
    
    doc.moveDown();
    
    // Resumo por departamento
    doc.fontSize(12)
       .text('Distribuição por Setor:', { underline: true })
       .moveDown(0.5);
    
    const departments = ['Comercial', 'Marketing', 'Financeiro'];
    departments.forEach(dept => {
      const deptTickets = reportData.tickets.filter(t => t.department === dept).length;
      const percentage = totalTickets > 0 ? Math.round((deptTickets / totalTickets) * 100) : 0;
      doc.text(`• ${dept}: ${deptTickets} chamados (${percentage}%)`);
    });
    
    doc.moveDown(2);
    
    // Adiciona um gráfico simples de distribuição
    this.addSummaryChart(doc, reportData);
  }

  private addDepartmentPage(doc: PDFKit.PDFDocument, reportData: any, department: string) {
    const deptTickets = reportData.tickets.filter(t => t.department === department);
    const total = deptTickets.length;
    
    const resolved = deptTickets.filter(t => t.status === 'closed').length;
    const inProgress = deptTickets.filter(t => t.status === 'in_progress').length;
    const open = deptTickets.filter(t => t.status === 'open').length;
    const overdue = deptTickets.filter(t => t.isOverdue).length;
    
    // Cabeçalho da página do departamento
    doc.fillColor('#2c3e50')
       .fontSize(20)
       .text(`Setor ${department}`, { align: 'center' });
    
    doc.moveDown();
    
    // Linha divisória
    doc.strokeColor('#3498db')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown();
    
    // Métricas do setor
    doc.fontSize(14)
       .fillColor('#16a085')
       .text('Resumo do Setor', { underline: true });
    
    doc.fontSize(12)
       .fillColor('#333333')
       .text(`Foram registrados ${total} chamados para o setor ${department} no período.`)
       .moveDown();
    
    doc.text('Distribuição por Status:', { underline: true })
       .moveDown(0.5);
    
    doc.list([
      `Concluídos: ${resolved} (${total > 0 ? Math.round((resolved/total)*100) : 0}%)`,
      `Em progresso: ${inProgress} (${total > 0 ? Math.round((inProgress/total)*100) : 0}%)`,
      `Abertos: ${open} (${total > 0 ? Math.round((open/total)*100) : 0}%)`,
      `Em atraso: ${overdue}`
    ]);
    
    doc.moveDown();
    
    // Gráfico de status
    this.addStatusChart(doc, resolved, inProgress, open, total);
    
    doc.moveDown();
    
    // Lista detalhada de tickets com descrição
    if (deptTickets.length > 0) {
      this.addTicketDetails(doc, deptTickets);
    }
  }

  private addSummaryChart(doc: PDFKit.PDFDocument, reportData: any) {
    const departments = ['Comercial', 'Marketing', 'Financeiro'];
    const data = departments.map(dept => ({
      label: dept,
      value: reportData.tickets.filter(t => t.department === dept).length,
      color: this.getDepartmentColor(dept)
    }));
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;
    
    const chartWidth = 400;
    const chartHeight = 200;
    const x = 50;
    const y = doc.y;
    
    // Desenha o gráfico de barras
    let currentX = x;
    const maxValue = Math.max(...data.map(item => item.value));
    const barWidth = 80;
    const spacing = 20;
    
    data.forEach(item => {
      const barHeight = item.value > 0 ? (item.value / maxValue) * (chartHeight - 40) : 5;
      
      doc.fillColor(item.color)
         .rect(currentX, y + chartHeight - barHeight - 20, barWidth, barHeight)
         .fill();
      
      // Valor
      doc.fillColor('#333333')
         .fontSize(10)
         .text(item.value.toString(), currentX, y + chartHeight - 15, {
           width: barWidth,
           align: 'center'
         });
      
      // Label
      doc.text(item.label, currentX, y + chartHeight, {
        width: barWidth,
        align: 'center'
      });
      
      currentX += barWidth + spacing;
    });
    
    doc.moveDown(5);
  }

  private addStatusChart(doc: PDFKit.PDFDocument, resolved: number, inProgress: number, open: number, total: number) {
    if (total === 0) return;
    
    const resolvedPercent = (resolved / total) * 100;
    const inProgressPercent = (inProgress / total) * 100;
    const openPercent = (open / total) * 100;
    
    const chartWidth = 400;
    const chartHeight = 20;
    const x = 50;
    const y = doc.y;
    
    // Cores para cada status
    const resolvedColor = '#4CAF50';
    const inProgressColor = '#FFC107';
    const openColor = '#F44336';
    
    // Criar SVG para o gráfico de barras
    const svg = `
      <svg width="${chartWidth}" height="${chartHeight}">
        <rect x="0" y="0" width="${chartWidth * (resolvedPercent/100)}" height="${chartHeight}" fill="${resolvedColor}"/>
        <rect x="${chartWidth * (resolvedPercent/100)}" y="0" width="${chartWidth * (inProgressPercent/100)}" height="${chartHeight}" fill="${inProgressColor}"/>
        <rect x="${chartWidth * ((resolvedPercent + inProgressPercent)/100)}" y="0" width="${chartWidth * (openPercent/100)}" height="${chartHeight}" fill="${openColor}"/>
      </svg>
    `;
    
    // Adicionar gráfico ao PDF
    SVGToPDF(doc, svg, x, y);
    
    // Legenda
    doc.fontSize(10)
       .fillColor('#333333')
       .text(`Legenda: `, x, y + chartHeight + 10)
       .fillColor(resolvedColor).text('Concluídos ', { continued: true })
       .fillColor(inProgressColor).text(' Em Progresso ', { continued: true })
       .fillColor(openColor).text(' Abertos');
    
    doc.moveDown(2);
  }

  private addTicketDetails(doc: PDFKit.PDFDocument, tickets: any[]) {
    doc.fontSize(14)
       .fillColor('#16a085')
       .text('Tickets Detalhados', { underline: true });
    
    doc.moveDown(0.5);

    tickets.forEach((ticket, index) => {
      // Adiciona uma linha divisória entre os tickets, exceto para o primeiro
      if (index > 0) {
        doc.strokeColor('#cccccc')
           .lineWidth(0.5)
           .moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .stroke();
        doc.moveDown(0.5);
      }

      // Verifica se precisa de nova página antes de adicionar os detalhes do ticket
      // Estimativa de espaço necessário para o título, status, data e descrição
      const estimatedHeight = 60 + (ticket.description ? this.estimateTextHeight(doc, this.extractPlainText(ticket.description), doc.page.width - 100, 10) : 0);
      if (doc.y + estimatedHeight > doc.page.height - 50) { 
        doc.addPage();
      }

      doc.fontSize(12)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text(`Ticket ID: ${ticket.id} - ${ticket.title}`, { continued: false });
      
      doc.fontSize(10)
         .fillColor('#333333')
         .font('Helvetica')
         .text(`Status: ${this.formatStatus(ticket.status)} | Criado em: ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`);
      
      doc.moveDown(0.5);

      if (ticket.description) {
        doc.fontSize(10)
           .fillColor('#555555')
           .font('Helvetica-Bold')
           .text('Descrição:');
        
        doc.font('Helvetica')
           .fontSize(10)
           .text(this.extractPlainText(ticket.description), {
             align: 'justify',
             indent: 10,
             paragraphGap: 5
           });
        doc.moveDown(1);
      }
      doc.moveDown(1);
    });
  }

  private extractPlainText(htmlString: string): string {
    if (!htmlString) return '';
    // Remove tags de imagem e PDF
    let cleanString = htmlString.replace(/<img[^>]*>/g, '');
    cleanString = cleanString.replace(/<a[^>]*\.(pdf|PDF)[^>]*>.*?<\/a>/g, '');
    // Remove todas as outras tags HTML
    cleanString = cleanString.replace(/<[^>]*>/g, '');
    // Substitui múltiplos espaços por um único espaço e remove espaços no início/fim
    return cleanString.replace(/\s\s+/g, ' ').trim();
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Progresso';
      case 'closed': return 'Fechado';
      default: return status;
    }
  }

  private getDepartmentColor(department: string): string {
    const colors: Record<string, string> = {
      'Comercial': '#3498db',
      'Marketing': '#9b59b6',
      'Financeiro': '#e74c3c'
    };
    return colors[department] || '#95a5a6';
  }

  // Função auxiliar para estimar a altura do texto (aproximada)
  private estimateTextHeight(doc: PDFKit.PDFDocument, text: string, maxWidth: number, fontSize: number): number {
    doc.fontSize(fontSize);
    const lines = doc.font('Helvetica').widthOfString(text, { width: maxWidth }) / maxWidth;
    return lines * fontSize * 1.2; // Multiplica por 1.2 para espaçamento de linha
  }
}

