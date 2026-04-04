import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';
import { SidebarService } from '../../services/sidebar.service';

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
export class ClientOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  paginatedOrders: Order[] = [];
  loading: boolean = true;
  error: string | null = null;
  isMobile: boolean = false;
  
  // Filter states
  statusFilter: string = 'All';
  dateFilter: string = '';
  searchQuery: string = '';
  
  // Status options
  statuses: string[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  
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
    private dialog: MatDialog,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadOrders();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
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
        this.applyFilters();
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
    const dialogWidth = this.isMobile ? '95vw' : '800px';
    this.dialog.open(OrderDetailsModalComponent, {
      data: order,
      width: dialogWidth,
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'order-details-dialog',
      disableClose: false,
      autoFocus: false
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
        (order.traitement && order.traitement.toLowerCase().includes(query))
      );
    }
    
    this.filteredOrders = filtered;
    this.currentPage = 1; // Reset to first page when filters change
    this.updatePagination();
  }

  resetFilters(): void {
    this.statusFilter = 'All';
    this.dateFilter = '';
    this.searchQuery = '';
    this.filteredOrders = [...this.orders];
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  // Helper method to normalize status display
  getDisplayStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  // Helper method to calculate total price
  calculateTotalPrice(order: Order): number {
    const price1 = parseFloat(order.price) || 0;
    const price2 = parseFloat(order.price2 || '0') || 0;
    const shippingCost = order.shipping_type === 'express' ? 3000 : 0;
    const total = price1 + price2 + shippingCost;
    return total;
  }

  // Helper method to check if order has second price
  hasSecondPrice(order: Order): boolean {
    return !!(order.price2 && order.price2 !== null && order.price2 !== undefined && parseFloat(order.price2) > 0);
  }
} 
