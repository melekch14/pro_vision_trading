import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';

interface Order {
  id: number;
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
  [key: string]: any; // For other properties
}

@Component({
  selector: 'app-client-orders',
  templateUrl: './client-orders.component.html',
  styleUrls: ['./client-orders.component.css'],
  standalone: false
})
export class ClientOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Filter states
  statusFilter: string = 'All';
  dateFilter: string = '';
  searchQuery: string = '';
  
  // Status options
  statuses: string[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  
  // Table columns
  displayedColumns: string[] = [
    'id',
    'orderDate',
    'customer',
    'status',
    'price',
    'shipping',
    'actions'
  ];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;
    
    const clientId = this.authService.getClientId();
    if (!clientId) {
      this.error = 'Client ID not found. Please log in again.';
      this.loading = false;
      return;
    }

    this.orderService.getClientOrders(clientId.toString()).subscribe({
      next: (response) => {
        this.orders = response;
        this.filteredOrders = [...this.orders];
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load orders. Please try again later.';
        this.loading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  openOrderDetails(order: Order): void {
    this.dialog.open(OrderDetailsModalComponent, {
      data: order,
      width: '800px',
      maxHeight: '90vh'
    });
  }

  applyFilters(): void {
    let filtered = [...this.orders];
    
    // Apply status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(order => 
        order.status.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }
    
    // Apply date filter
    if (this.dateFilter) {
      const filterDate = new Date(this.dateFilter);
      filtered = filtered.filter(order => 
        new Date(order.order_datetime).toDateString() === filterDate.toDateString()
      );
    }
    
    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.id.toString().includes(query) ||
        `${order.first_name} ${order.last_name}`.toLowerCase().includes(query) ||
        order.traitement.toLowerCase().includes(query)
      );
    }
    
    this.filteredOrders = filtered;
  }

  resetFilters(): void {
    this.statusFilter = 'All';
    this.dateFilter = '';
    this.searchQuery = '';
    this.filteredOrders = [...this.orders];
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  // Helper method to normalize status display
  getDisplayStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  // Helper method to calculate total price
  calculateTotalPrice(order: Order): string {
    const price1 = parseFloat(order.price) || 0;
    const price2 = parseFloat(order.price2 || '0') || 0;
    const total = price1 + price2;
    return total.toFixed(2);
  }

  // Helper method to check if order has second price
  hasSecondPrice(order: Order): boolean {
    return !!(order.price2 && order.price2 !== null && order.price2 !== undefined && parseFloat(order.price2) > 0);
  }
} 