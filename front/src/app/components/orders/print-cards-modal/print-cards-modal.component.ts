import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Order } from '../../../models/order.model';
import { OrderService } from '../../../services/order.service';
import { ProductService } from '../../../services/product.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StockService } from '../../../services/stock.service';

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
  private articleDiameters: { [key: number]: string } = {};
  private stockArticleMap: { [key: number]: number } = {}; // stockId -> articleId
  private odProductLibelle: { [key: number]: string } = {}; // orderId -> OD product name
  private ogProductLibelle: { [key: number]: string } = {}; // orderId -> OG product name
  private odProductDiametre: { [key: number]: string } = {}; // orderId -> OD diameter
  private ogProductDiametre: { [key: number]: string } = {}; // orderId -> OG diameter

  constructor(
    private dialogRef: MatDialogRef<PrintCardsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orders: Order[] },
    private orderService: OrderService,
    private productService: ProductService,
    private stockService: StockService
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

      for (const order of this.orders) {
        const key = order.order_id;
        if (order.origineArticle === 'fabrication') {
          // Fabrication logic
          // OD (Right Eye)
          if (order.fabrication1) {
            try {
              const product = await this.orderService.getArticleById(order.fabrication1.toString()).toPromise();
              if (product) {
                this.odProductLibelle[key] = product.libelle || 'N/A';
                this.odProductDiametre[key] = product.diametre?.toString() || '70';
              } else {
                this.odProductLibelle[key] = 'N/A';
                this.odProductDiametre[key] = '70';
              }
            } catch (error) {
              this.odProductLibelle[key] = 'N/A';
              this.odProductDiametre[key] = '70';
            }
          } else {
            this.odProductLibelle[key] = 'N/A';
            this.odProductDiametre[key] = '70';
          }
          // OG (Left Eye)
          if (order.fabrication2) {
            try {
              const product = await this.orderService.getArticleById(order.fabrication2.toString()).toPromise();
              if (product) {
                this.ogProductLibelle[key] = product.libelle || 'N/A';
                this.ogProductDiametre[key] = product.diametre?.toString() || '70';
              } else {
                this.ogProductLibelle[key] = 'N/A';
                this.ogProductDiametre[key] = '70';
              }
            } catch (error) {
              this.ogProductLibelle[key] = 'N/A';
              this.ogProductDiametre[key] = '70';
            }
          } else {
            // If no separate OG, use OD for both
            this.ogProductLibelle[key] = this.odProductLibelle[key] || 'N/A';
            this.ogProductDiametre[key] = this.odProductDiametre[key] || '70';
          }
        } else {
          // Stock logic (current)
          // OD (Right Eye)
          if (order.produit) {
            try {
              const stock = await this.stockService.getStockById(order.produit).toPromise();
              if (stock && stock.article_id) {
                this.stockArticleMap[order.produit] = stock.article_id;
                const product = await this.orderService.getArticleById(stock.article_id.toString()).toPromise();
                if (product) {
                  this.odProductLibelle[key] = product.libelle || 'N/A';
                  this.odProductDiametre[key] = product.diametre?.toString() || '70';
                  order.article_libelle = this.odProductLibelle[key];
                  this.articleDiameters[order.produit] = this.odProductDiametre[key];
                }
              } else {
                this.odProductLibelle[key] = 'N/A';
                this.odProductDiametre[key] = '70';
                this.articleDiameters[order.produit] = '70';
              }
            } catch (error) {
              this.odProductLibelle[key] = 'N/A';
              this.odProductDiametre[key] = '70';
              this.articleDiameters[order.produit] = '70';
            }
          }
          if (order['produit2']) {
            try {
              const stock = await this.stockService.getStockById(order['produit2']).toPromise();
              if (stock && stock.article_id) {
                this.stockArticleMap[order['produit2']] = stock.article_id;
                const product = await this.orderService.getArticleById(stock.article_id.toString()).toPromise();
                if (product) {
                  this.ogProductLibelle[key] = product.libelle || 'N/A';
                  this.ogProductDiametre[key] = product.diametre?.toString() || '70';
                }
              } else {
                this.ogProductLibelle[key] = 'N/A';
                this.ogProductDiametre[key] = '70';
              }
            } catch (error) {
              this.ogProductLibelle[key] = 'N/A';
              this.ogProductDiametre[key] = '70';
            }
          } else {
            this.ogProductLibelle[key] = this.odProductLibelle[key] || 'N/A';
            this.ogProductDiametre[key] = this.odProductDiametre[key] || '70';
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

  getDiametre(order: Order, eye: 'od' | 'og' = 'od'): string {
    const key = order.order_id;
    if (eye === 'og') {
      return this.ogProductDiametre[key] || '70';
    }
    return this.odProductDiametre[key] || '70';
  }

  getProductLibelle(order: Order, eye: 'od' | 'og' = 'od'): string {
    const key = order.order_id;
    if (eye === 'og') {
      return this.ogProductLibelle[key] || 'N/A';
    }
    return this.odProductLibelle[key] || 'N/A';
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
          margin-top: 20px;
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
      `;

      for (let i = 0; i < this.orders.length; i++) {
        const order = this.orders[i];
        const key = order.order_id;
        const fournisseurText = String(order['fournisseur_code'] || order.fournisseur_id || 'N/A');
        const dateText = order.order_datetime ? (new Date(order.order_datetime)).toLocaleDateString('fr-FR') : '';

        // Determine if only one eye is present or both
        const odLibelle = this.getProductLibelle(order, 'od');
        const ogLibelle = this.getProductLibelle(order, 'og');
        const showOG = ogLibelle && ogLibelle !== odLibelle;

        // Build the card HTML for PDF with conditional OD/OG display
        const cardHtml = `
          <div class="order-card">
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label">Opticien :</span>
                <span class="product">${(order['raison_social'] || 'Opticien Name').toUpperCase()}</span>
              </div>
            </div>
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label">Porteur :</span>
                <span class="product bold-italic">${(order.first_name + ' ' + order.last_name).toUpperCase()}</span>
              </div>
            </div>
            <div class="card-row">
              <div class="verre-block">
                <span class="verre-label">verres :</span>
                <span class="product">${odLibelle}</span>
              </div>
            </div>
            ${showOG ? `<div class=\"card-row\"><div class=\"verre-block\"><span class=\"verre-label\"></span><span class=\"product\">${ogLibelle}</span></div></div>` : ''}
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
                    <td>${this.getDiametre(order, 'od')}</td>
                    <td>${order.od_sphere || '0.00'}</td>
                    <td>${order.od_cylinder || '0.00'}</td>
                    <td>${order['od_axe'] || '0'}</td>
                    <td>${order.od_addition || '0.00'}</td>
                  </tr>
                  ${showOG ? `<tr><td>${this.getDiametre(order, 'og')}</td><td>${order.og_sphere || '0.00'}</td><td>${order.og_cylinder || '0.00'}</td><td>${order['og_axe'] || '0'}</td><td>${order.og_addition || '0.00'}</td></tr>` : ''}
                </tbody>
              </table>
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

        // Draw fournisseur vertically (right edge, near top)
        pdf.saveGraphicsState();
        pdf.setFont('Arial', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(34, 34, 34);
        pdf.text(fournisseurText, 3.45, 0.5, { angle: 90 });
        pdf.restoreGraphicsState();
        // Draw date vertically (right edge, lower)
        pdf.saveGraphicsState();
        pdf.setFont('Arial', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(34, 34, 34);
        pdf.text(dateText, 3.45, 1.5, { angle: 90 });
        pdf.restoreGraphicsState();
      }

      pdf.save('cards.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.error = 'Failed to generate PDF. Please try again.';
    }
  }
}
