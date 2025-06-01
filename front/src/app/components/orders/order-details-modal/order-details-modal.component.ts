import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

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
  fournisseur_id?: number;
  payment_status?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class OrderDetailsModalComponent {
  fournisseurs: any[] = []; // Will store the list of fournisseurs
  selectedFournisseur: number | undefined;
  tempFournisseur: number | undefined;
  activeTab: 'details' | 'management' = 'details';
  selectedStatus: string;
  tempStatus: string;
  statuses: string[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  isUpdating: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public order: Order,
    private http: HttpClient
  ) {
    this.selectedFournisseur = this.order.fournisseur_id;
    this.tempFournisseur = this.order.fournisseur_id;
    this.selectedStatus = this.order.status;
    this.tempStatus = this.order.status;
    this.loadFournisseurs();
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
      this.http.patch(`${environment.apiUrl}/orders/${this.order.id}`, {
        status: this.tempStatus
      }).subscribe({
        next: (response) => {
          this.order.status = this.tempStatus;
          this.selectedStatus = this.tempStatus;
          this.isUpdating = false;
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

  updateAll(): void {
    if (this.tempStatus !== this.selectedStatus || this.tempFournisseur !== this.selectedFournisseur) {
      this.isUpdating = true;
      const updates = {
        status: this.tempStatus,
        fournisseurCode: this.tempFournisseur
      };
      
      this.http.patch(`${environment.apiUrl}/orders/${this.order.order_id}/status`, updates).subscribe({
        next: (response) => {
          this.order.status = this.tempStatus;
          this.selectedStatus = this.tempStatus;
          this.order.fournisseur_id = this.tempFournisseur;
          this.selectedFournisseur = this.tempFournisseur;
          this.isUpdating = false;
          // You might want to show a success message here
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
} 