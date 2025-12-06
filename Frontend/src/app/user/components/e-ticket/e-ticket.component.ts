import { Component, input, OnInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../../../core/models/booking.model';
import * as QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-e-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './e-ticket.component.html',
  styleUrls: ['./e-ticket.component.css']
})
export class ETicketComponent implements OnInit {
  booking = input.required<Booking>();
  @ViewChild('ticketContent', { static: false }) ticketContent!: ElementRef;
  
  qrCodeDataUrl: string = '';
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.generateQRCode();
  }

  generateQRCode(): void {
    const booking = this.booking();
    const ticketInfo = `Ticket: ${booking.ticketNumber}\nMovie: ${booking.movieTitle}\nTheater: ${booking.theaterName}\nShow: ${this.formatDateTime(booking.showtime)}\nSeats: ${this.getSeatDisplay()}\nAmount: ${this.formatCurrency(booking.totalAmount)}`;
    
    QRCode.toDataURL(ticketInfo, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M'
    }).then(url => {
      this.qrCodeDataUrl = url;
      this.cdr.detectChanges();
    }).catch(error => {
      console.error('QR Code generation failed:', error);
      this.qrCodeDataUrl = '';
      this.cdr.detectChanges();
    });
  }

  getSeatDisplay(): string {
    const booking = this.booking();
    if (booking.seatLabels && booking.seatLabels.length > 0) {
      return booking.seatLabels.join(', ');
    }
    return booking.seats?.join(', ') || 'N/A';
  }

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  async downloadPDF(): Promise<void> {
    try {
      this.alertService.info('Generating PDF...');
      
      const element = this.ticketContent.nativeElement;
      
      if (!this.qrCodeDataUrl) {
        await this.generateQRCode();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#f5f7fa',
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowHeight: element.scrollHeight,
        imageTimeout: 0
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        const ratio = pageHeight / imgHeight;
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = pageHeight;
        const xOffset = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
      }
      
      const booking = this.booking();
      pdf.save(`RevTicket_${booking.ticketNumber || booking.id}.pdf`);
      this.alertService.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      this.alertService.error('Failed to download PDF. Please try again.');
    }
  }

  async shareTicket(): Promise<void> {
    const booking = this.booking();
    const shareData = {
      title: `Movie Ticket - ${booking.movieTitle}`,
      text: `🎬 ${booking.movieTitle}\n🏢 ${booking.theaterName}\n📅 ${this.formatDateTime(booking.showtime)}\n💺 ${this.getSeatDisplay()}\n🎫 Ticket: ${booking.ticketNumber}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        this.alertService.success('Ticket shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          this.copyToClipboard();
        }
      }
    } else {
      this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    const booking = this.booking();
    const text = `🎬 ${booking.movieTitle}\n🏢 ${booking.theaterName}\n📅 ${this.formatDateTime(booking.showtime)}\n💺 ${this.getSeatDisplay()}\n🎫 ${booking.ticketNumber}`;
    
    navigator.clipboard.writeText(text).then(() => {
      this.alertService.success('Ticket details copied to clipboard!');
    }).catch(() => {
      this.alertService.error('Failed to copy ticket details.');
    });
  }

  printTicket(): void {
    window.print();
  }
}
