import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../services/order.service';
import { StockService } from '../../../services/stock.service';
import { ArticleService } from '../../../services/article.service';

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
  typeCommande: string;
  typeCorrection: string;
  origineArticle: string;
  article_libelle?: string;
  sphere?: number;
  cylindre?: number;
  addition?: number;
  selected_file?: string;
  fournisseur_id?: number;
  payment_status?: string;
  od_sphere?: string;
  od_cylinder?: string;
  od_addition?: string;
  od_axe?: string;
  og_sphere?: string;
  og_cylinder?: string;
  og_addition?: string;
  og_axe?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class OrderDetailsModalComponent implements OnInit {
  fournisseurs: any[] = []; // Will store the list of fournisseurs
  selectedFournisseur: number | undefined;
  tempFournisseur: number | undefined;
  activeTab: 'details' | 'management' = 'details';
  selectedStatus: string;
  tempStatus: string;
  statuses: string[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  isUpdating: boolean = false;
  orderDetails: Order | null = null;
  showCard: boolean = false;
  productLibelle: string = '';
  productDiametre: string = '70';

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public order: Order,
    private http: HttpClient,
    private orderService: OrderService,
    private stockService: StockService,
    private articleService: ArticleService
  ) {
    this.selectedFournisseur = this.order['fournisseur_code'];
    this.tempFournisseur = this.order['fournisseur_code'];
    this.selectedStatus = this.order.status;
    this.tempStatus = this.order.status;
    this.loadFournisseurs();
  }

  ngOnInit() {
    this.loadOrderDetails();
    this.loadProductDetails();
  }

  loadOrderDetails() {
    console.log('Loading order details for order_id:', this.order.order_id);
    this.orderService.getOrderById(this.order.order_id.toString()).subscribe({
      next: (response) => {
        console.log('Order details received:', response);
        this.orderDetails = response;
        // Merge the details with the existing order data
        this.order = { ...this.order, ...response };
      },
      error: (error) => {
        console.error('Error loading order details:', error);
      }
    });
  }

  loadProductDetails() {
    if (this.order.produit) {
      this.stockService.getStockById(this.order.produit).subscribe({
        next: (stock) => {
          const articleId = stock.article_id;
          this.articleService.getArticleById(articleId).subscribe({
            next: (article) => {
              this.productLibelle = article.libelle || 'N/A';
              this.productDiametre = article.diametre?.toString() || '70';
            },
            error: (error) => {
              console.error('Error loading article details:', error);
              this.productLibelle = 'N/A';
              this.productDiametre = '70';
            }
          });
        },
        error: (error) => {
          console.error('Error loading stock details:', error);
          this.productLibelle = 'N/A';
          this.productDiametre = '70';
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

  switchTab(tab: 'details' | 'management'): void {
    this.activeTab = tab;
  }

  loadFournisseurs(): void {
    // Load fournisseurs from your API
    this.http.get(`${environment.apiUrl}/fournisseurs`).subscribe({
      next: (response: any) => {
        this.fournisseurs = response;
        console.log(this.fournisseurs);
      },
      error: (error) => {
        console.error('Error loading fournisseurs:', error);
      }
    });
  }

  updateFournisseur(): void {
    if (this.tempFournisseur !== undefined) {
      this.isUpdating = true;
      this.http.patch(`${environment.apiUrl}/orders/${this.order.id}`, {
        fournisseur_id: this.tempFournisseur
      }).subscribe({
        next: (response) => {
          this.order.fournisseur_id = this.tempFournisseur;
          this.selectedFournisseur = this.tempFournisseur;
          this.isUpdating = false;
          // You might want to show a success message here
        },
        error: (error) => {
          console.error('Error updating fournisseur:', error);
          this.tempFournisseur = this.selectedFournisseur; // Reset on error
          this.isUpdating = false;
          // You might want to show an error message here
        }
      });
    }
  }

  updateStatus(): void {
    if (this.tempStatus) {
      this.isUpdating = true;
      this.http.patch(`${environment.apiUrl}/orders/${this.order.id}/status`, {
        status: this.tempStatus,
        fournisseurCode: this.tempFournisseur || this.order['fournisseur_code']
      }).subscribe({
        next: (response) => {
          const wasProcessing = this.selectedStatus === 'Processing';
          this.order.status = this.tempStatus;
          this.selectedStatus = this.tempStatus;
          this.isUpdating = false;
          // Decrement stock if status changed to Processing
          if (this.tempStatus === 'Processing' && !wasProcessing && this.order.produit) {
            this.stockService.decrementStock(this.order.produit).subscribe({
              next: () => {},
              error: (err) => { console.error('Error decrementing stock:', err); }
            });
          }
          // You might want to show a success message here
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.tempStatus = this.selectedStatus; // Reset on error
          this.isUpdating = false;
          // You might want to show an error message here
        }
      });
    }
  }

  cancelChanges(): void {
    this.tempFournisseur = this.selectedFournisseur;
    this.tempStatus = this.selectedStatus;
  }

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
    
    if (this.order.origineArticle === 'fabrication') {
      return this.order.article_libelle;
    }
    
    const cyl = this.order.cylindre !== null && this.order.cylindre !== undefined ? 
               this.order.cylindre.toString().padStart(4, '0') : 
               (this.order.addition !== null && this.order.addition !== undefined ? 
               this.order.addition.toString().padStart(4, '0') : '0000');
    const sph = this.order.sphere?.toString().padStart(4, '0') || '0000';
    return `${this.order.article_libelle} (${cyl}) - ${sph}`;
  }

  getDiametre(): string {
    return this.productDiametre;
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

  updateAll(): void {
    if (this.tempStatus !== this.selectedStatus || this.tempFournisseur !== this.selectedFournisseur) {
      this.isUpdating = true;
      const updates = {
        status: this.tempStatus,
        fournisseur_code: this.tempFournisseur
      };
      const wasProcessing = this.selectedStatus === 'Processing';
      this.http.patch(`${environment.apiUrl}/orders/${this.order.id}/status`, updates).subscribe({
        next: (response) => {
          this.order.status = this.tempStatus;
          this.selectedStatus = this.tempStatus;
          this.order['fournisseur_code'] = this.tempFournisseur;
          this.selectedFournisseur = this.tempFournisseur;
          this.isUpdating = false;
          // Decrement stock if status changed to Processing
          if (this.tempStatus === 'Processing' && !wasProcessing && this.order.produit) {
            this.stockService.decrementStock(this.order.produit).subscribe({
              next: () => {},
              error: (err) => { console.error('Error decrementing stock:', err); }
            });
          }
          // Close the modal and pass true to indicate successful update
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating order:', error);
          this.tempStatus = this.selectedStatus;
          this.tempFournisseur = this.selectedFournisseur;
          this.isUpdating = false;
          // You might want to show an error message here
        }
      });
    }
  }

  printCard() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the card element
    const card = document.querySelector('.order-card');
    if (!card) return;

    // Get all the card-related styles
    const styles = `
      .order-card {
        background: #fff;
        border: none;
        width: 3.5in;
        height: 2in;
        padding: 30px;
        padding-left: 0px;
        margin-top: 80px;
        font-family: Arial, sans-serif;
        color: #222;
        font-size: 11px;
        letter-spacing: 0.01em;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        overflow: hidden;
        align-items: center;
        text-align: center;
      }
      .card-fournisseur-vertical {
        position: absolute;
        top: 12px;
        right: 2px;
        height: 44px;
        display: flex;
        align-items: flex-start;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-size: 10px;
        font-weight: bold;
        color: #222;
        transform: rotate(180deg);
        letter-spacing: 0.05em;
        line-height: 1.1;
      }
      .card-row {
        display: flex;
        gap: 4px;
        margin-bottom: 3px;
        align-items: baseline;
        justify-content: center;
        width: 100%;
        text-align: center;
      }
      .verre-block {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: center;
        width: 100%;
        margin-bottom: 3px;
        text-align: center;
      }
      .verre-label {
        display: inline-block;
        min-width: 60px;
        max-width: 60px;
        text-align: center;
        font-weight: bold;
      }
      .product {
        font-size: 11px;
      }
      .bold-italic {
        font-weight: bold;
        font-style: italic;
      }
      .table-date-row {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        width: 100%;
        margin-top: 5px;
      }
      .card-table {
        width: 250px;
        min-width: 0;
        max-width: 300px;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 10px;
        text-align: center;
        display: inline-table;
      }
      .card-table th, .card-table td {
        border: none;
        text-align: center;
        padding: 0 3px;
        font-size: 10px;
        min-width: 18px;
        max-width: 32px;
      }
      .card-table th {
        font-weight: bold;
      }
      .card-date-vertical {
        position: absolute;
        top: 85px;
        right: 2px;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-size: 10px;
        font-weight: bold;
        color: #222;
        transform: rotate(180deg);
        letter-spacing: 0.05em;
        line-height: 1.1;
        height: auto;
        display: flex;
        align-items: flex-start;
        margin-left: 0;
      }
    `;

    // Write the HTML content to the new window
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Card</title>
          <style>
            @page {
              size: 3.5in 2in;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 3.5in;
              height: 2in;
              overflow: hidden;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            ${styles}
          </style>
        </head>
        <body>
          ${card.outerHTML}
        </body>
      </html>
    `);

    // Wait for content to load then print
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  }
} 