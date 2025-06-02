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
  first_name: string;
  last_name: string;
  shipping_type: string;
  delivery_time: string;
  produit: number;
  supplement: string;
  traitement: string;
  email?: string;
  phone?: string;
  raison_social: string;
  client_id: number;
  article_libelle?: string;
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

  ngOnInit(): void {
    if (this.data.orders && this.data.orders.length > 0) {
      const clientId = this.data.orders[0].client_id;
      this.loadCustomerDetails(clientId);
      this.loadProductDetails();
      this.calculateTotal();
    }
  }

  loadCustomerDetails(clientId: number): void {
    this.customerService.getCustomerById(clientId).subscribe({
      next: (customer) => {
        this.customerDetails = customer;
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
      }
    });
  }

  loadProductDetails(): void {
    this.data.orders.forEach(order => {
      if (order.produit) {
        this.orderService.getStockById(order.produit.toString()).subscribe({
          next: (stock) => {
            if (stock.article_id) {
              this.orderService.getArticleById(stock.article_id.toString()).subscribe({
                next: (article) => {
                  order.article_libelle = article.libelle;
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
    });
  }

  calculateTotal(): void {
    this.totalAmount = this.data.orders.reduce((sum, order) => {
      const price = parseFloat(order.price) || 0;
      return sum + price;
    }, 0);
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
} 