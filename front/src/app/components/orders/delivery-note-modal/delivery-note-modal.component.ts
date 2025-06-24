import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../shared/models/customer.model';
import { OrderService } from '../../../services/order.service';

interface Order {
  id: number;
  order_id: number;
  order_datetime: string;
  status: string;
  price: string;
  price2?: string;
  first_name: string;
  last_name: string;
  shipping_type: string;
  delivery_time: string;
  produit: number;
  produit2?: number;
  typeCorrection: string;
  typeCommande: string;
  email?: string;
  phone?: string;
  raison_social: string;
  client_id: number;
  article_libelle?: string;
  article_libelle2?: string;
  isFabrication1?: boolean;
  isFabrication2?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-delivery-note-modal',
  templateUrl: './delivery-note-modal.component.html',
  styleUrls: ['./delivery-note-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DeliveryNoteModalComponent implements OnInit {
  currentDate: string;
  deliveryNoteNumber: string;
  customerDetails: Customer | null = null;
  totalAmount: number = 0;

  constructor(
    public dialogRef: MatDialogRef<DeliveryNoteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orders: Order[] },
    private customerService: CustomerService,
    private orderService: OrderService
  ) {
    this.currentDate = new Date().toLocaleDateString('fr-FR');
    this.deliveryNoteNumber = this.generateDeliveryNoteNumber();
  }

  formatValue(value: string): string {
    if (!value) return 'N/A';
    return value.replace(/_/g, ' ');
  }

  ngOnInit(): void {
    if (this.data.orders && this.data.orders.length > 0) {
      console.log('Initial Orders Data:', this.data.orders);
      const clientId = this.data.orders[0].client_id;
      this.loadCustomerDetails(clientId);
      this.loadProductDetails();
      this.calculateTotal();
    }
  }

  loadCustomerDetails(clientId: number): void {
    this.customerService.getCustomerById(clientId).subscribe({
      next: (customer) => {
        console.log('Customer Details:', customer);
        this.customerDetails = customer;
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
      }
    });
  }

  loadProductDetails(): void {
    this.data.orders.forEach(order => {
      // First product: check fabrication1, otherwise use stock
      if (order['fabrication1']) {
        this.orderService.getArticleById(order['fabrication1'].toString()).subscribe({
          next: (article) => {
            order.article_libelle = article.libelle;
            order.isFabrication1 = article.origineArticle === 'fabrication';
          },
          error: (error) => {
            console.error('Error loading fabrication article details:', error);
          }
        });
      } else if (order.produit) {
        this.orderService.getStockById(order.produit.toString()).subscribe({
          next: (stock) => {
            if (stock.article_id) {
              this.orderService.getArticleById(stock.article_id.toString()).subscribe({
                next: (article) => {
                  order.article_libelle = article.libelle;
                  order.isFabrication1 = article.origineArticle === 'fabrication';
                },
                error: (error) => {
                  console.error('Error loading article details:', error);
                }
              });
            }
          },
          error: (error) => {
            console.error('Error loading stock details:', error);
          }
        });
      }
      // Second product: check fabrication2, otherwise use stock
      if (order['fabrication2']) {
        this.orderService.getArticleById(order['fabrication2'].toString()).subscribe({
          next: (article) => {
            order.article_libelle2 = article.libelle;
            order.isFabrication2 = article.origineArticle === 'fabrication';
          },
          error: (error) => {
            console.error('Error loading fabrication2 article details:', error);
          }
        });
      } else if (order.produit2) {
        this.orderService.getStockById(order.produit2.toString()).subscribe({
          next: (stock) => {
            if (stock.article_id) {
              this.orderService.getArticleById(stock.article_id.toString()).subscribe({
                next: (article) => {
                  order.article_libelle2 = article.libelle;
                  order.isFabrication2 = article.origineArticle === 'fabrication';
                },
                error: (error) => {
                  console.error('Error loading article details for produit2:', error);
                }
              });
            }
          },
          error: (error) => {
            console.error('Error loading stock details for produit2:', error);
          }
        });
      }
    });
  }

  calculateTotal(): void {
    this.totalAmount = this.data.orders.reduce((sum, order) => {
      const price = parseFloat(order.price) || 0;
      const price2 = parseFloat(order.price2 || '0') || 0;
      return sum + price + price2;
    }, 0);
    console.log('Total Amount:', this.totalAmount);
    console.log('Final Orders with all details:', this.data.orders);
  }

  generateDeliveryNoteNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BL-${year}${month}${day}-${random}`;
  }

  printDeliveryNote(): void {
    window.print();
  }

  close(): void {
    this.dialogRef.close();
  }

  // Helper to sum two price values as numbers
  sumPrices(price1: string | number | null | undefined, price2: string | number | null | undefined): number {
    const p1 = typeof price1 === 'string' ? parseFloat(price1) : (price1 || 0);
    const p2 = typeof price2 === 'string' ? parseFloat(price2) : (price2 || 0);
    return p1 + p2;
  }
} 