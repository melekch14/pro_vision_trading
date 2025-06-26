import { Component, OnInit, Input } from '@angular/core';
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
  @Input() readonly: boolean = false;
  @Input() customer: Customer | null = null;
  isEditMode: boolean = false;
  formTitle: string = 'Add New Customer';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  customerStatuses = Object.values(CustomerStatus);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.customer) {
      // Use provided customer (readonly modal)
      this.isEditMode = false;
      this.formTitle = 'Détails du client';
    } else {
      const customerId = this.route.snapshot.paramMap.get('id');
      if (customerId && customerId !== 'new') {
        this.isEditMode = true;
        this.formTitle = 'Edit Customer';
        this.loadCustomer(+customerId);
      }
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
      password: '',
      rccm: '',
      ninea: '',
      code_douane: ''
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
      this.successMessage = '';

      const request = this.isEditMode
        ? this.http.put(`${environment.apiUrl}/clients/${this.customer?.id ?? ''}`, this.customer)
        : this.http.post(`${environment.apiUrl}/clients`, this.customer);

      request.subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (!this.isEditMode && response.codee) {
            this.successMessage = `Customer created successfully! Generated code: ${response.codee}`;
            setTimeout(() => {
              this.router.navigate(['/app/customers']);
            }, 2000);
          } else {
            this.router.navigate(['/app/customers']);
          }
        },
        error: (error) => {
          console.error('Error saving customer:', error);
          this.errorMessage = error.error?.message || 'Failed to save customer data';
          this.isLoading = false;
        }
      });
    }
  }

  validateForm(): boolean {
    const baseValidation = (
      (this.customer?.raison_social?.trim() ?? '') !== '' &&
      (this.customer?.email?.trim() ?? '') !== '' &&
      (this.customer?.responsable?.trim() ?? '') !== '' &&
      (this.customer?.tel?.trim() ?? '') !== '' &&
      (this.customer?.status?.trim() ?? '') !== '' &&
      (this.customer?.adresse?.trim() ?? '') !== ''
    );

    // For edit mode, code is required. For new customers, password is required
    if (this.isEditMode) {
      return baseValidation && (this.customer?.codee?.trim() ?? '') !== '';
    } else {
      return baseValidation && (this.customer?.password?.trim() ?? '').length >= 6;
    }
  }

  cancel(): void {
    this.router.navigate(['/app/customers']);
  }
}
