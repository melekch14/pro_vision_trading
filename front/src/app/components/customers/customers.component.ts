import { Component, OnInit } from '@angular/core';
import { Customer } from '../../shared/models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  standalone: false
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchQuery: string = '';
  sortBy: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  constructor(private customerService: CustomerService) {}
  
  ngOnInit(): void {
    this.loadCustomers();
  }
  
  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.customerService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = [...this.customers];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.errorMessage = 'Failed to load customers';
        this.isLoading = false;
      }
    });
  }
  
  applyFilters(): void {
    let filtered = [...this.customers];
    
    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.raison_social.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.codee.toLowerCase().includes(query) ||
        customer.responsable.toLowerCase().includes(query) ||
        customer.id.toString().includes(query)
      );
    }
    
    // Apply sorting
    this.sortCustomers(filtered);
    
    this.filteredCustomers = filtered;
  }
  
  sortCustomers(customers: Customer[]): void {
    customers.sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortBy) {
        case 'raison_social':
          valueA = a.raison_social;
          valueB = b.raison_social;
          break;
        case 'email':
          valueA = a.email;
          valueB = b.email;
          break;
        case 'responsable':
          valueA = a.responsable;
          valueB = b.responsable;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a.id;
          valueB = b.id;
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  setSortBy(field: string): void {
    if (this.sortBy === field) {
      // Toggle direction if already sorting by this field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }
  
  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
  
  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'id';
    this.sortDirection = 'asc';
    this.filteredCustomers = [...this.customers];
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.customers = this.customers.filter(c => c.id !== id);
          this.filteredCustomers = this.filteredCustomers.filter(c => c.id !== id);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.errorMessage = 'Failed to delete customer';
          this.isLoading = false;
        }
      });
    }
  }

  editCustomer(customer: Customer): void {
    // Navigate to edit page or open edit modal
    // This will be implemented based on your routing setup
    console.log('Edit customer:', customer);
  }
} 