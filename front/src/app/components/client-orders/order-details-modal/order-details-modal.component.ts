import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../services/order.service';
import { environment } from '../../../../environments/environment';
import { PriceFormatPipe } from '../../../shared/pipes/price-format.pipe';

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
  fabrication1?: number;
  fabrication2?: number;
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
  imports: [CommonModule, MatIconModule, PriceFormatPipe]
})
export class OrderDetailsModalComponent implements OnInit {
  productLibelle: string = '';
  odProductLibelle: string = '';
  ogProductLibelle: string = '';
  fabricationOdLibelle: string = '';
  fabricationOgLibelle: string = '';

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderDetails,
    private datePipe: DatePipe,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.loadOrderDetails();
    this.loadProductDetails();
    this.loadFabricationDetails();
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
      this.orderService.getStockById(this.data.produit.toString()).subscribe({
        next: (stockResponse) => {
          if (stockResponse && stockResponse.article_id) {
            this.orderService.getArticleById(stockResponse.article_id.toString()).subscribe({
              next: (articleResponse) => {
                this.odProductLibelle = articleResponse.libelle || 'N/A';
                this.productLibelle = this.odProductLibelle;
              },
              error: () => {
                this.odProductLibelle = 'N/A';
                this.productLibelle = 'N/A';
              }
            });
          } else {
            this.odProductLibelle = 'N/A';
            this.productLibelle = 'N/A';
          }
        },
        error: () => {
          this.odProductLibelle = 'N/A';
          this.productLibelle = 'N/A';
        }
      });
    }

    // Load OG (Left Eye) product details
    if (this.data.produit2) {
      this.orderService.getStockById(this.data.produit2.toString()).subscribe({
        next: (stockResponse) => {
          if (stockResponse && stockResponse.article_id) {
            this.orderService.getArticleById(stockResponse.article_id.toString()).subscribe({
              next: (articleResponse) => {
                this.ogProductLibelle = articleResponse.libelle || 'N/A';
              },
              error: () => {
                this.ogProductLibelle = 'N/A';
              }
            });
          } else {
            this.ogProductLibelle = 'N/A';
          }
        },
        error: () => {
          this.ogProductLibelle = 'N/A';
        }
      });
    }
  }

  loadFabricationDetails() {
    if (this.data.origineArticle === 'fabrication') {
      // OD (Right Eye)
      if (this.data.fabrication1) {
        this.orderService.getArticleById(this.data.fabrication1.toString()).subscribe({
          next: (articleResponse) => {
            this.fabricationOdLibelle = articleResponse.libelle || 'N/A';
          },
          error: () => {
            this.fabricationOdLibelle = 'N/A';
          }
        });
      } else {
        this.fabricationOdLibelle = 'N/A';
      }
      // OG (Left Eye)
      if (this.data.fabrication2) {
        this.orderService.getArticleById(this.data.fabrication2.toString()).subscribe({
          next: (articleResponse) => {
            this.fabricationOgLibelle = articleResponse.libelle || 'N/A';
          },
          error: () => {
            this.fabricationOgLibelle = 'N/A';
          }
        });
      } else {
        this.fabricationOgLibelle = 'N/A';
      }
    }
  }

  formatText(text: string): string {
    if (!text) return 'N/A';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatShippingType(type: string): string {
    if (!type) return 'N/A';
    if (type.toLowerCase() === 'express') {
      return 'Illico';
    }
    if (type.toLowerCase() === 'free') {
      return 'Gratuite';
    }
    return type;
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

  formatFabricationLibelleForEye(eye: 'od' | 'og'): string {
    if (eye === 'od') {
      return this.fabricationOdLibelle;
    } else if (eye === 'og') {
      return this.fabricationOgLibelle;
    }
    return 'N/A';
  }

  needsSecondProduct(): boolean {
    return !!(this.data.produit2 && this.data.produit2 !== null && this.data.produit2 !== undefined);
  }

  downloadFile(): void {
    if (this.data.id) {
      const downloadUrl = `${environment.apiUrl}/orders/download/${this.data.id}`;
      window.open(downloadUrl, '_blank');
    }
  }

  calculateTotalPrice(): number {
    const price1 = parseFloat(this.data.price) || 0;
    const price2 = parseFloat(this.data.price2 || '0') || 0;
    const shippingCost = this.data.shipping_type === 'express' ? 3000 : 0;
    const total = price1 + price2 + shippingCost;
    return total;
  }

  hasSecondPrice(): boolean {
    return !!(this.data.price2 && this.data.price2 !== null && this.data.price2 !== undefined && parseFloat(this.data.price2) > 0);
  }

  areFabricationArticlesSame(): boolean {
    return (
      this.data.origineArticle === 'fabrication' &&
      this.data.fabrication1 != null &&
      this.data.fabrication2 != null &&
      this.data.fabrication1 === this.data.fabrication2
    );
  }

  hasTwoFabricationArticles(): boolean {
    return (
      this.data.origineArticle === 'fabrication' &&
      this.data.fabrication1 != null &&
      this.data.fabrication2 != null &&
      this.data.fabrication1 !== this.data.fabrication2
    );
  }
} 
