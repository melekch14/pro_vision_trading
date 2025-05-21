import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer, CustomerStatus } from '../../shared/models/customer.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  isLoading: boolean = false;
  errorMessage: string = '';
  customerStatuses = Object.values(CustomerStatus);
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    
    if (customerId && customerId !== 'new') {
      this.isEditMode = true;
      this.formTitle = 'Edit Customer';
      this.loadCustomer(+customerId);
    }
  }
  
  getEmptyCustomer(): Customer {
    return {
      id: 0,
      codee: '',
      raison_social: '',
      email: '',
      responsable: '',
      tel: '',
      status: CustomerStatus.Active,
      adresse: '',
      password: ''
    };
  }
  
  loadCustomer(id: number): void {
    this.isLoading = true;
    this.http.get<Customer>(`${environment.apiUrl}/clients/${id}`).subscribe({
      next: (data) => {
        this.customer = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.errorMessage = 'Failed to load customer data';
        this.isLoading = false;
      }
    });
  }
  
  onSubmit(): void {
    if (this.validateForm()) {
      this.isLoading = true;
      this.errorMessage = '';

      const request = this.isEditMode
        ? this.http.put(`${environment.apiUrl}/clients/${this.customer.id}`, this.customer)
        : this.http.post(`${environment.apiUrl}/clients`, this.customer);

      request.subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error saving customer:', error);
          this.errorMessage = 'Failed to save customer data';
          this.isLoading = false;
        }
      });
    }
  }
  
  validateForm(): boolean {
    return (
      this.customer.codee.trim() !== '' &&
      this.customer.raison_social.trim() !== '' &&
      this.customer.email.trim() !== '' &&
      this.customer.password.trim() !== '' &&
      this.customer.password.length >= 6 &&
      this.customer.responsable.trim() !== '' &&
      this.customer.tel.trim() !== '' &&
      this.customer.status.trim() !== '' &&
      this.customer.adresse.trim() !== ''
    );
  }
  
  cancel(): void {
    this.router.navigate(['/customers']);
  }
} 