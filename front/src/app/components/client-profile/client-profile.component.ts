import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Customer } from '../../shared/models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { ProfileUpdateRequestService } from '../../services/profile-update-request.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.css'],
  standalone: false
})
export class ClientProfileComponent implements OnInit, OnDestroy {
  user: Customer | null = null;
  editMode = false;
  editedUser: Partial<Customer> = {};
  loading = false;
  error: string | null = null;
  passwordResetRequested = false;
  resetToken = '';
  newPassword = '';
  showPassword = false;
  pendingRequests: any[] = [];
  isMobile: boolean = false;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private profileUpdateRequestService: ProfileUpdateRequestService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.checkMobile();
    this.fetchUser();
    this.fetchPendingRequests();
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

  fetchPendingRequests() {
    const clientId = this.authService.getClientId();
    if (!clientId) return;

    this.profileUpdateRequestService.getPendingRequestsByClientId(clientId).subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
      },
      error: (err) => {
        console.error('Failed to fetch pending requests:', err);
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
    this.error = null;

    // Submit profile update request instead of direct update
    this.profileUpdateRequestService.createProfileUpdateRequest(this.user.id, this.editedUser).subscribe({
      next: (response) => {
        this.editMode = false;
        this.fetchPendingRequests();
        alert('Profile update request submitted successfully! Waiting for admin approval.');
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to submit profile update request.';
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

  getRequestedDataKeys(requestedData: any): string[] {
    if (!requestedData || !requestedData.requested_data) {
      return [];
    }
    
    // Filter out password-related fields
    const passwordFields = ['password', 'mot_de_passe', 'pwd', 'pass', 'password_reset_token', 'password_reset_expires'];
    
    return Object.keys(requestedData.requested_data || {}).filter(key => {
      // Skip password fields
      return !passwordFields.some(pwdField => key.toLowerCase().includes(pwdField));
    });
  }

  getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      'raison_social': 'Raison Sociale',
      'responsable': 'Responsable',
      'email': 'Email',
      'tel': 'Téléphone',
      'adresse': 'Adresse',
      'rccm': 'RCCM',
      'ninea': 'NINEA',
      'code_douane': 'Code Douane'
    };
    return labels[key] || key;
  }

  getRequestedValue(request: any, key: string): string {
    if (!request.requested_data || !request.requested_data.requested_data) {
      return '';
    }
    return request.requested_data.requested_data[key] || '';
  }
} 