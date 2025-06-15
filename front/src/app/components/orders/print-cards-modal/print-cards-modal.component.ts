import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Order } from '../../../models/order.model';
import { OrderService } from '../../../services/order.service';
import { ProductService } from '../../../services/product.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-print-cards-modal',
  templateUrl: './print-cards-modal.component.html',
  styleUrls: ['./print-cards-modal.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class PrintCardsModalComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<PrintCardsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orders: Order[] },
    private orderService: OrderService,
    private productService: ProductService
  ) {
    this.orders = data.orders;
  }

  ngOnInit() {
    this.loadProductDetails();
  }

  async loadProductDetails() {
    try {
      this.loading = true;
      this.error = null;

      // Load product details for each order
      for (const order of this.orders) {
        if (order.article_id) {
          try {
            const product = await this.productService.getProduct(order.article_id).toPromise();
            if (product) {
              order.article_libelle = product.libelle;
            }
          } catch (error) {
            console.error(`Error loading product details for order ${order.order_id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      this.error = 'Failed to load product details. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  close() {
    this.dialogRef.close();
  }

  async exportToPDF() {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [3.5, 2]
      });

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

      for (let i = 0; i < this.orders.length; i++) {
        const order = this.orders[i];
        // Build the card HTML as in printCard()
        const cardHtml = `
          <div class="order-card">
            <div class="card-fournisseur-vertical">${order['fournisseur_code'] || order.fournisseur_id || 'N/A'}</div>
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label">Opticien:</span>
                <span class="product">${(order['raison_social'] || 'Opticien Name').toUpperCase()}</span>
              </div>
            </div>
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label">Porteur:</span>
                <span class="product bold-italic">${(order.first_name + ' ' + order.last_name).toUpperCase()}</span>
              </div>
            </div>
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label">verres:</span>
                <span class="product">${order.article_libelle || 'Product Name'}</span>
              </div>
            </div>
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label"></span>
                <span class="product">${order.article_libelle || 'Product Name'}</span>
              </div>
            </div>
            <div class="table-date-row">
              <table class="card-table">
                <thead>
                  <tr>
                    <th>Ø</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXE</th>
                    <th>ADD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>65</td>
                    <td>${order.od_sphere || '0.00'}</td>
                    <td>${order.od_cylinder || '0.00'}</td>
                    <td>${order['od_axe'] || '0'}</td>
                    <td>${order.od_addition || '0.00'}</td>
                  </tr>
                  <tr>
                    <td>65</td>
                    <td>${order.og_sphere || '0.00'}</td>
                    <td>${order.og_cylinder || '0.00'}</td>
                    <td>${order['og_axe'] || '0'}</td>
                    <td>${order.og_addition || '0.00'}</td>
                  </tr>
                </tbody>
              </table>
              <div class="card-date-vertical">${order.order_datetime ? (new Date(order.order_datetime)).toLocaleDateString('fr-FR') : ''}</div>
            </div>
          </div>
        `;

        // Create an offscreen container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '3.5in';
        container.style.height = '2in';
        container.innerHTML = `<style>${styles}</style>${cardHtml}`;
        document.body.appendChild(container);

        // Wait for DOM to render
        await new Promise(resolve => setTimeout(resolve, 100));

        // Render to canvas
        const canvas = await html2canvas(container.querySelector('.order-card') as HTMLElement, {
          scale: 4,
          useCORS: true,
          backgroundColor: '#fff',
          width: 3.5 * 96,
          height: 2 * 96
        });

        // Remove the container
        document.body.removeChild(container);

        // Add to PDF
        if (i > 0) pdf.addPage([3.5, 2], 'landscape');
        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 3.5, 2);
      }

      pdf.save('cards.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.error = 'Failed to generate PDF. Please try again.';
    }
  }

  getDiametre() {
    return '65';
  }
} 