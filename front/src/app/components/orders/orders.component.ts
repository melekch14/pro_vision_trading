import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';

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

    this.orderService.getAllOrders().subscribe({
      next: (response: Order[]) => {
        this.orders = response;
        this.filteredOrders = [...this.orders];
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

  exportOrders(): void {
    // Prepare CSV content
    const headers = 'Order ID,Customer,Date,Status,Total Amount,Shipping Type,Delivery Time\n';
    const rows = this.filteredOrders.map(order => {
      const date = new Date(order.order_datetime).toISOString().split('T')[0];
      return `${order.id},"${order.first_name} ${order.last_name}",${date},${order.status},${order.price},${order.shipping_type},${order.delivery_time}`;
    }).join('\n');
    
    const csvContent = headers + rows;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and click it
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
} 