import { Component, OnInit } from '@angular/core';
import { Customer, CustomerStatus } from '../../shared/models/customer.model';

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
  statusFilter: string = 'All';
  sortBy: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Get all possible status values for dropdown
  statuses: string[] = Object.values(CustomerStatus);
  
  ngOnInit(): void {
    // Load sample customers data
    this.customers = this.getSampleCustomers();
    this.filteredCustomers = [...this.customers];
  }
  
  getSampleCustomers(): Customer[] {
    return [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02108',
          country: 'USA'
        },
        joinDate: new Date(2022, 2, 15),
        totalOrders: 12,
        totalSpent: 1245.87,
        status: CustomerStatus.Active
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '(555) 987-6543',
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        },
        joinDate: new Date(2022, 6, 20),
        totalOrders: 5,
        totalSpent: 567.50,
        status: CustomerStatus.Active
      },
      {
        id: 3,
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@example.com',
        phone: '(555) 222-3333',
        address: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'USA'
        },
        joinDate: new Date(2023, 1, 10),
        totalOrders: 3,
        totalSpent: 325.45,
        status: CustomerStatus.New
      },
      {
        id: 4,
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@example.com',
        phone: '(555) 444-5555',
        address: {
          street: '101 Maple Rd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA'
        },
        joinDate: new Date(2022, 9, 5),
        totalOrders: 8,
        totalSpent: 890.20,
        status: CustomerStatus.Active
      },
      {
        id: 5,
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        phone: '(555) 777-8888',
        address: {
          street: '202 Cedar Blvd',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'USA'
        },
        joinDate: new Date(2021, 5, 12),
        totalOrders: 0,
        totalSpent: 0,
        status: CustomerStatus.Inactive
      }
    ];
  }
  
  applyFilters(): void {
    let filtered = [...this.customers];
    
    // Apply status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(customer => customer.status === this.statusFilter);
    }
    
    // Apply search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(query) ||
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
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`;
          valueB = `${b.firstName} ${b.lastName}`;
          break;
        case 'joinDate':
          valueA = a.joinDate.getTime();
          valueB = b.joinDate.getTime();
          break;
        case 'totalOrders':
          valueA = a.totalOrders;
          valueB = b.totalOrders;
          break;
        case 'totalSpent':
          valueA = a.totalSpent;
          valueB = b.totalSpent;
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
    this.statusFilter = 'All';
    this.searchQuery = '';
    this.sortBy = 'id';
    this.sortDirection = 'asc';
    this.filteredCustomers = [...this.customers];
  }
  
  getStatusClass(status: CustomerStatus): string {
    switch (status) {
      case CustomerStatus.Active:
        return 'status-active';
      case CustomerStatus.Inactive:
        return 'status-inactive';
      case CustomerStatus.New:
        return 'status-new';
      default:
        return '';
    }
  }
  
  getFullAddress(customer: Customer): string {
    const { street, city, state, postalCode, country } = customer.address;
    return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
  }
} 