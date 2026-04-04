import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';
import { DeliveryNoteModalComponent } from './delivery-note-modal/delivery-note-modal.component';
import { PrintCardsModalComponent } from './print-cards-modal/print-cards-modal.component';
import { PageEvent } from '@angular/material/paginator';
import { PriceFormatService } from '../../shared/services/price-format.service';

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
  supplement: string;
  traitement: string;
  email?: string;
  phone?: string;
  raison_social: string;
  [key: string]: any;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  standalone: false
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading: boolean = true;
  error: string | null = null;
  selectedOrders: Set<number> = new Set();
  selectedClient: string | null = null;

  // Pagination properties
  pageSize: number = 10;
  pageIndex: number = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Filter states
  statusFilter: string = 'All';
  dateFilter: string = '';
  searchQuery: string = '';

  // Status options
  statuses: string[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  // Table columns
  displayedColumns: string[] = [
    'select',
    'orderId',
    'client',
    'orderDate',
    'status',
    'price',
    'shipping',
    'actions'
  ];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private dialog: MatDialog,
    private priceFormat: PriceFormatService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.orderService.getAllOrders().subscribe({
      next: (response: Order[]) => {
        this.orders = response;
        this.filteredOrders = [...this.orders];
        this.filteredOrders.forEach(order => order['_selected'] = this.selectedOrders.has(order.id));
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load orders. Please try again later.';
        this.loading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  openOrderDetails(order: Order): void {
    const dialogRef = this.dialog.open(OrderDetailsModalComponent, {
      data: order,
      width: '800px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadOrders();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }

    if (this.dateFilter) {
      const filterDate = new Date(this.dateFilter);
      filtered = filtered.filter(order =>
        new Date(order.order_datetime).toDateString() === filterDate.toDateString()
      );
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.order_id.toString().includes(query) ||
        (order.raison_social && order.raison_social.toLowerCase().includes(query))
      );
    }

    this.filteredOrders = filtered;
    this.filteredOrders.forEach(order => order['_selected'] = this.selectedOrders.has(order.id));
    this.pageIndex = 0; // Reset to first page when filters change
  }

  resetFilters(): void {
    this.statusFilter = 'All';
    this.dateFilter = '';
    this.searchQuery = '';
    this.filteredOrders = [...this.orders];
    this.pageIndex = 0; // Reset to first page when filters are reset
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getDisplayStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getShippingClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'free': return 'shipping-free';
      case 'express': return 'shipping-express';
      default: return 'shipping-default';
    }
  }

  getTotalPrice(order: Order): number {
    const basePrice = parseFloat(order.price) || 0;
    const price2 = parseFloat(order.price2 || '0') || 0;
    const shippingCost = order.shipping_type === 'express' ? 3000 : 0;
    const total = basePrice + price2 + shippingCost;
    return total;
  }

  exportOrders(): void {
    const headers = 'Order ID,Customer,Date,Status,Total Amount,Shipping Type,Delivery Time\n';
    const rows = this.filteredOrders.map(order => {
      const date = new Date(order.order_datetime).toISOString().split('T')[0];
      const totalPrice = this.priceFormat.format(this.getTotalPrice(order));
      return `${order.id},"${order.first_name} ${order.last_name}",${date},${order.status},${totalPrice},${order.shipping_type},${order.delivery_time}`;
    }).join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  toggleOrderSelection(order: Order): void {
    if (this.selectedOrders.size === 0) {
      this.selectedOrders.add(order.id);
      this.selectedClient = order.raison_social;
      return;
    }

    if (order.raison_social !== this.selectedClient) {
      this.selectedOrders.clear();
      this.selectedOrders.add(order.id);
      this.selectedClient = order.raison_social;
      return;
    }

    if (this.selectedOrders.has(order.id)) {
      this.selectedOrders.delete(order.id);
      if (this.selectedOrders.size === 0) {
        this.selectedClient = null;
      }
      return;
    }

    this.selectedOrders.add(order.id);
  }

  isOrderSelected(orderId: number): boolean {
    return this.selectedOrders.has(orderId);
  }

  getSelectedOrdersCount(): number {
    return this.orders.filter(order => order['_selected']).length;
  }

  getSelectedClient(): string | null {
    const selected = this.orders.find(order => order['_selected']);
    return selected ? selected.raison_social : null;
  }

  openDeliveryNote(): void {
    const selectedOrders = this.orders.filter(order => order['_selected']);

    if (selectedOrders.length === 0) {
      return;
    }

    const dialogRef = this.dialog.open(DeliveryNoteModalComponent, {
      data: { orders: selectedOrders },
      width: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'full-width-dialog'
    });
  }

  openPrintCards(): void {
    const selectedOrders = this.orders.filter(order =>
      order['_selected'] &&
      (order['fournisseur_code'] || order['fournisseur_id']) &&
      order.status
    );

    if (selectedOrders.length === 0) {
      return;
    }

    const dialogRef = this.dialog.open(PrintCardsModalComponent, {
      data: { orders: selectedOrders },
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'print-cards-dialog',
      disableClose: false,
      autoFocus: true
    });
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }

  onOrderCheckboxChange(order: Order, checked: boolean): void {
    if (checked) {
      if (this.selectedOrders.size === 0 || order.raison_social === this.selectedClient) {
        this.selectedOrders.add(order.id);
        this.selectedClient = order.raison_social;
      } else {
        this.selectedOrders.clear();
        this.selectedOrders.add(order.id);
        this.selectedClient = order.raison_social;
        this.filteredOrders.forEach(o => o['_selected'] = o.id === order.id);
      }
    } else {
      this.selectedOrders.delete(order.id);
      if (this.selectedOrders.size === 0) {
        this.selectedClient = null;
      }
    }
  }

  // Add pagination event handler
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  // Get current page data
  getCurrentPageData(): Order[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredOrders.slice(startIndex, startIndex + this.pageSize);
  }
}
