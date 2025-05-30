import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe, CommonModule } from '@angular/common';

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
  shipping_type: string;
  delivery_time: string;
  produit: number;
  supplement: string;
  traitement: string;
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
  imports: [CommonModule]
})
export class OrderDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderDetails,
    private datePipe: DatePipe
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'medium') || date;
  }
} 