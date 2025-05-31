import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Order {
  id: number;
  order_id: number;
  order_datetime: string;
  status: string;
  price: string;
  first_name: string;
  last_name: string;
  shipping_type: string;
  delivery_time: string;
  produit: number;
  supplement: string;
  traitement: string;
  article_libelle?: string;
  sphere?: number;
  cylindre?: number;
  addition?: number;
  selected_file?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class OrderDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public order: Order,
    private http: HttpClient
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getDisplayStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  formatStockLibelle(): string {
    if (!this.order.article_libelle) return `Product ID: ${this.order.produit}`;
    
    const cyl = this.order.cylindre !== null && this.order.cylindre !== undefined ? 
               this.order.cylindre.toString().padStart(4, '0') : 
               (this.order.addition !== null && this.order.addition !== undefined ? 
               this.order.addition.toString().padStart(4, '0') : '0000');
    const sph = this.order.sphere?.toString().padStart(4, '0') || '0000';
    return `${this.order.article_libelle} (${cyl}) - ${sph}`;
  }

  downloadFile(): void {
    if (this.order.selected_file) {
      const url = `${environment.apiUrl}/orders/download/${this.order.id}`;
      this.http.get(url, { responseType: 'blob' }).subscribe(
        (blob: Blob) => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = this.order.selected_file || 'order_file';
          link.click();
          window.URL.revokeObjectURL(link.href);
        },
        error => {
          console.error('Error downloading file:', error);
          // You might want to show an error message to the user here
        }
      );
    }
  }
} 