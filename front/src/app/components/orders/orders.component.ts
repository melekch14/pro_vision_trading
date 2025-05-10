import { Component, OnInit } from '@angular/core';
import { Order, OrderStatus } from '../../shared/models/order.model';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  standalone: false
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  statusFilter: string = 'All';
  dateFilter: string = '';
  searchQuery: string = '';
  showOrderDetails: Record<number, boolean> = {};
  
  // Get all possible status values for dropdown
  statuses: string[] = Object.values(OrderStatus);
  
  ngOnInit(): void {
    // Load sample orders data
    this.orders = this.getSampleOrders();
    this.filteredOrders = [...this.orders];
  }
  
  getSampleOrders(): Order[] {
    return [
      {
        id: 1001,
        customerName: 'John Smith',
        orderDate: new Date(2023, 5, 15),
        totalAmount: 239.98,
        status: OrderStatus.Delivered,
        items: [
          { id: 1, productId: 1, productName: 'Product 1', quantity: 2, unitPrice: 19.99 },
          { id: 2, productId: 2, productName: 'Product 2', quantity: 3, unitPrice: 29.99 },
          { id: 3, productId: 3, productName: 'Product 3', quantity: 1, unitPrice: 39.99 }
        ]
      },
      {
        id: 1002,
        customerName: 'Jane Doe',
        orderDate: new Date(2023, 6, 20),
        totalAmount: 89.98,
        status: OrderStatus.Shipped,
        items: [
          { id: 4, productId: 1, productName: 'Product 1', quantity: 1, unitPrice: 19.99 },
          { id: 5, productId: 2, productName: 'Product 2', quantity: 2, unitPrice: 29.99 }
        ]
      },
      {
        id: 1003,
        customerName: 'Robert Johnson',
        orderDate: new Date(2023, 7, 5),
        totalAmount: 159.96,
        status: OrderStatus.Processing,
        items: [
          { id: 6, productId: 2, productName: 'Product 2', quantity: 4, unitPrice: 29.99 },
          { id: 7, productId: 3, productName: 'Product 3', quantity: 1, unitPrice: 39.99 }
        ]
      },
      {
        id: 1004,
        customerName: 'Sarah Williams',
        orderDate: new Date(2023, 7, 10),
        totalAmount: 79.98,
        status: OrderStatus.Pending,
        items: [
          { id: 8, productId: 1, productName: 'Product 1', quantity: 4, unitPrice: 19.99 }
        ]
      },
      {
        id: 1005,
        customerName: 'Michael Brown',
        orderDate: new Date(2023, 7, 15),
        totalAmount: 129.97,
        status: OrderStatus.Cancelled,
        items: [
          { id: 9, productId: 2, productName: 'Product 2', quantity: 3, unitPrice: 29.99 },
          { id: 10, productId: 3, productName: 'Product 3', quantity: 1, unitPrice: 39.99 }
        ]
      }
    ];
  }
  
  toggleOrderDetails(orderId: number): void {
    this.showOrderDetails[orderId] = !this.showOrderDetails[orderId];
  }
  
  applyFilters(): void {
    let filtered = [...this.orders];
    
    // Apply status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }
    
    // Apply date filter
    if (this.dateFilter) {
      const filterDate = new Date(this.dateFilter);
      filtered = filtered.filter(order => 
        order.orderDate.getFullYear() === filterDate.getFullYear() &&
        order.orderDate.getMonth() === filterDate.getMonth() &&
        order.orderDate.getDate() === filterDate.getDate()
      );
    }
    
    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(query) ||
        order.id.toString().includes(query)
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
  
  exportOrders(): void {
    // Prepare CSV content
    const headers = 'Order ID,Customer,Date,Status,Total Amount\n';
    const rows = this.filteredOrders.map(order => {
      const date = order.orderDate.toISOString().split('T')[0];
      return `${order.id},"${order.customerName}",${date},${order.status},$${order.totalAmount.toFixed(2)}`;
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
  
  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
        return 'status-pending';
      case OrderStatus.Processing:
        return 'status-processing';
      case OrderStatus.Shipped:
        return 'status-shipped';
      case OrderStatus.Delivered:
        return 'status-delivered';
      case OrderStatus.Cancelled:
        return 'status-cancelled';
      default:
        return '';
    }
  }
} 