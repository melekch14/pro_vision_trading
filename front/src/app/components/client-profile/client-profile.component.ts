import { Component, OnInit } from '@angular/core';
import { Customer } from '../../shared/models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.css'],
  standalone: false
})
export class ClientProfileComponent implements OnInit {
  user: Customer | null = null;
  editMode = false;
  editedUser: Partial<Customer> = {};
  loading = false;
  error: string | null = null;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.fetchUser();
  }

  fetchUser() {
    this.loading = true;
    this.error = null;
    const clientId = this.authService.getClientId();
    if (!clientId) {
      this.error = 'No client ID found.';
      this.loading = false;
      return;
    }
    this.customerService.getCustomerById(clientId).subscribe({
      next: (customer) => {
        this.user = customer;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load client data.';
        this.loading = false;
      }
    });
  }

  enableEdit() {
    if (!this.user) return;
    this.editMode = true;
    this.editedUser = { ...this.user };
  }

  saveProfile() {
    if (!this.user) return;
    this.loading = true;
    this.customerService.updateCustomer(this.user.id, this.editedUser as Customer).subscribe({
      next: () => {
        this.editMode = false;
        this.fetchUser();
        alert('Profile updated successfully!');
      },
      error: () => {
        this.error = 'Failed to update profile.';
        this.loading = false;
      }
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.editedUser = { ...this.user };
  }

  resetPassword() {
    if (!this.user) return;
    // Placeholder: In real app, call backend to send email
    alert('A password reset email has been sent to ' + this.user.email);
  }
} 