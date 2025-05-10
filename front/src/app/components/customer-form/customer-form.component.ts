import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer, CustomerStatus, Address } from '../../shared/models/customer.model';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css'],
  standalone: false
})
export class CustomerFormComponent implements OnInit {
  customer: Customer = this.getEmptyCustomer();
  isEditMode: boolean = false;
  formTitle: string = 'Add New Customer';
  customerStatuses = Object.values(CustomerStatus);
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    
    if (customerId && customerId !== 'new') {
      this.isEditMode = true;
      this.formTitle = 'Edit Customer';
      // In a real app, you would fetch the customer from a service
      // For now, we'll use a mock customer
      this.customer = this.getMockCustomer(+customerId);
    }
  }
  
  getEmptyCustomer(): Customer {
    return {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      joinDate: new Date(),
      totalOrders: 0,
      totalSpent: 0,
      status: CustomerStatus.New
    };
  }
  
  getMockCustomer(id: number): Customer {
    // This would typically be fetched from a service
    return {
      id: id,
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
    };
  }
  
  onSubmit(): void {
    if (this.validateForm()) {
      // In a real app, you would save the customer via a service
      console.log('Saving customer:', this.customer);
      
      // Simulate API call delay
      setTimeout(() => {
        // Navigate back to customers list
        this.router.navigate(['/customers']);
      }, 500);
    }
  }
  
  validateForm(): boolean {
    // Basic validation
    return (
      this.customer.firstName.trim() !== '' &&
      this.customer.lastName.trim() !== '' &&
      this.customer.email.trim() !== ''
    );
  }
  
  cancel(): void {
    this.router.navigate(['/app/customers']);
  }
} 