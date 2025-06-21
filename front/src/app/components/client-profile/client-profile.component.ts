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
  passwordResetRequested = false;
  resetToken = '';
  newPassword = '';

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
    if (!this.user || !this.user.email) return;
    this.authService.requestPasswordReset(this.user.email).subscribe({
      next: () => {
        this.passwordResetRequested = true;
        alert('A password reset link has been sent to ' + this.user!.email);
      },
      error: () => {
        alert('Failed to send password reset email.');
      }
    });
  }

  submitNewPassword() {
    if (!this.resetToken || !this.newPassword) return;
    this.authService.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: () => {
        alert('Password has been reset successfully!');
        this.passwordResetRequested = false;
        this.resetToken = '';
        this.newPassword = '';
      },
      error: (err) => {
        alert('Failed to reset password: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }
} 