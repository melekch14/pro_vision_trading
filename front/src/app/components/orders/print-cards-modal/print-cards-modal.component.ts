import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../services/order.service';
import { forkJoin } from 'rxjs';

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
  raison_social?: string;
  fournisseur_code?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-print-cards-modal',
  templateUrl: './print-cards-modal.component.html',
  styleUrls: ['./print-cards-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class PrintCardsModalComponent implements OnInit {
  orders: Order[] = [];
  productDiametre: string = '70';

  constructor(
    public dialogRef: MatDialogRef<PrintCardsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orders: Order[] },
    private orderService: OrderService
  ) {
    this.orders = data.orders;
  }

  ngOnInit() {
    // Create an array of observables for loading order details
    const orderDetailsObservables = this.orders.map(order => 
      this.orderService.getOrderById(order.order_id.toString())
    );

    // Load all order details in parallel
    forkJoin(orderDetailsObservables).subscribe({
      next: (responses) => {
        // Update each order with its complete details
        responses.forEach((response, index) => {
          Object.assign(this.orders[index], response);
        });

        // After loading order details, load product details
        this.orders.forEach(order => {
          if (order.produit) {
            this.orderService.getArticleById(order.produit.toString()).subscribe({
              next: (response) => {
                order.article_libelle = response.libelle || 'N/A';
                this.productDiametre = response.diametre || '70';
              },
              error: (error) => {
                console.error('Error loading product details:', error);
                order.article_libelle = 'N/A';
                this.productDiametre = '70';
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading order details:', error);
      }
    });
  }

  getDiametre(): string {
    return this.productDiametre;
  }

  close(): void {
    this.dialogRef.close();
  }

  printCards() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get all card elements
    const cards = document.querySelectorAll('.order-card');
    if (!cards.length) return;

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

    // Create HTML content with all cards
    const cardsHTML = Array.from(cards).map(card => card.outerHTML).join('');

    // Write the HTML content to the new window
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Cards</title>
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
          ${cardsHTML}
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