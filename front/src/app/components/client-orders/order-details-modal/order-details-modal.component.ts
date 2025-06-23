import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../services/order.service';

interface OrderDetails {
  id: number;
  client_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  order_datetime: string;
  status: string;
  price: string;
  price2?: string;
  shipping_type: string;
  delivery_time: string;
  produit: number;
  produit2?: number;
  typeCommande: string;
  typeCorrection: string;
  origineArticle: string;
  od_sphere: string;
  od_cylinder: string;
  od_axe: string;
  od_addition: string;
  og_sphere: string;
  og_cylinder: string;
  og_axe: string;
  og_addition: string;
  selected_file?: string;
  stock_article_id?: number;
}

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.css'],
  providers: [DatePipe],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class OrderDetailsModalComponent implements OnInit {
  productLibelle: string = '';
  odProductLibelle: string = '';
  ogProductLibelle: string = '';

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderDetails,
    private datePipe: DatePipe,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.loadOrderDetails();
    this.loadProductDetails();
  }

  loadOrderDetails() {
    console.log(this.data.id);
    this.orderService.getOrderById(this.data.id.toString()).subscribe({
      next: (response) => {
        console.log(response);
        // Merge the details with the existing order data
        this.data = { ...this.data, ...response };
        // Reload product details after order details are loaded
        this.loadProductDetails();
      },
      error: (error) => {
        console.error('Error loading order details:', error);
      }
    });
  }

  loadProductDetails() {
    // Load OD (Right Eye) product details
    if (this.data.produit) {
      this.orderService.getArticleById(this.data.produit.toString()).subscribe({
        next: (response) => {
          this.odProductLibelle = response.libelle || 'N/A';
          // Keep legacy property for backward compatibility
          this.productLibelle = this.odProductLibelle;
        },
        error: (error) => {
          console.error('Error loading OD product details:', error);
          this.odProductLibelle = 'N/A';
          this.productLibelle = 'N/A';
        }
      });
    }

    // Load OG (Left Eye) product details
    if (this.data.produit2) {
      this.orderService.getArticleById(this.data.produit2.toString()).subscribe({
        next: (response) => {
          this.ogProductLibelle = response.libelle || 'N/A';
        },
        error: (error) => {
          console.error('Error loading OG product details:', error);
          this.ogProductLibelle = 'N/A';
        }
      });
    }
  }

  formatText(text: string): string {
    if (!text) return 'N/A';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  close(): void {
    this.dialogRef.close();
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'medium') || date;
  }

  formatStockLibelle(): string {
    return this.productLibelle;
  }

  formatStockLibelleForEye(eye: 'od' | 'og'): string {
    if (eye === 'od') {
      return this.odProductLibelle;
    } else if (eye === 'og') {
      return this.ogProductLibelle;
    }
    return 'N/A';
  }

  needsSecondProduct(): boolean {
    return !!(this.data.produit2 && this.data.produit2 !== null && this.data.produit2 !== undefined);
  }

  downloadFile(): void {
    if (this.data.selected_file) {
      window.open(this.data.selected_file, '_blank');
    }
  }
} 