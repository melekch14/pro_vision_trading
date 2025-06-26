import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer, CustomerStatus } from '../../shared/models/customer.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css'],
  standalone: false
})
export class CustomerFormComponent implements OnInit, OnChanges {
  @Input() readonly: boolean = false;
  @Input() customer: Customer | null = null;
  @Output() cancelForm = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  isEditMode: boolean = false;
  formTitle: string = 'Add New Customer';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  customerStatuses = Object.values(CustomerStatus);
  customerForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.customer) {
      this.isEditMode = true;
      this.formTitle = 'Modifier le client';
      this.customerForm.patchValue(this.customer);
      if (this.readonly) {
        this.customerForm.disable();
      }
    } else {
      const customerId = this.route.snapshot.paramMap.get('id');
      if (customerId && customerId !== 'new') {
        this.isEditMode = true;
        this.formTitle = 'Edit Customer';
        this.loadCustomer(+customerId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customer'] && this.customerForm && this.customer) {
      this.customerForm.patchValue(this.customer);
    }
  }

  initForm(): void {
    this.customerForm = this.fb.group({
      codee: [{ value: '', disabled: this.readonly }, [Validators.required]],
      raison_social: [{ value: '', disabled: this.readonly }, [Validators.required]],
      email: [{ value: '', disabled: this.readonly }, [Validators.required, Validators.email]],
      responsable: [{ value: '', disabled: this.readonly }, [Validators.required]],
      tel: [{ value: '', disabled: this.readonly }, [Validators.required]],
      status: [{ value: '', disabled: this.readonly }, [Validators.required]],
      adresse: [{ value: '', disabled: this.readonly }, [Validators.required]],
      rccm: [{ value: '', disabled: this.readonly }, [Validators.required]],
      ninea: [{ value: '', disabled: this.readonly }, [Validators.required]],
      code_douane: [{ value: '', disabled: this.readonly }, [Validators.required]],
      password: [{ value: '', disabled: this.readonly }]
    });
  }

  loadCustomer(id: number): void {
    this.isLoading = true;
    this.http.get<Customer>(`${environment.apiUrl}/clients/${id}`).subscribe({
      next: (data) => {
        this.customer = data;
        this.customerForm.patchValue(data);
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
    if (this.customerForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const formValue = this.customerForm.getRawValue();
    let request;
    if (this.isEditMode) {
      request = this.http.put(`${environment.apiUrl}/clients/${this.customer?.id ?? ''}`, formValue);
    } else {
      request = this.http.post(`${environment.apiUrl}/clients`, formValue);
    }
    request.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.updated.emit();
      },
      error: (error) => {
        console.error('Error saving customer:', error);
        this.errorMessage = error.error?.message || 'Failed to save customer data';
        this.isLoading = false;
      }
    });
  }

  cancelFormAction(): void {
    this.cancelForm.emit();
  }
}
