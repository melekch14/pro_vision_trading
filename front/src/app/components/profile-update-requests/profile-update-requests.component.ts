import { Component, OnInit } from '@angular/core';
import { ProfileUpdateRequestService, ProfileUpdateRequest } from '../../services/profile-update-request.service';

@Component({
  selector: 'app-profile-update-requests',
  templateUrl: './profile-update-requests.component.html',
  styleUrls: ['./profile-update-requests.component.css'],
  standalone: false
})
export class ProfileUpdateRequestsComponent implements OnInit {
  requests: ProfileUpdateRequest[] = [];
  loading = false;
  error: string | null = null;
  selectedStatus = 'pending';
  selectedRequest: ProfileUpdateRequest | null = null;
  adminNotes = '';

  constructor(private profileUpdateRequestService: ProfileUpdateRequestService) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.error = null;

    const observable = this.selectedStatus === 'all' 
      ? this.profileUpdateRequestService.getAllProfileUpdateRequests()
      : this.profileUpdateRequestService.getProfileUpdateRequestsByStatus(this.selectedStatus);

    observable.subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile update requests.';
        this.loading = false;
      }
    });
  }

  onStatusChange() {
    this.loadRequests();
  }

  selectRequest(request: ProfileUpdateRequest) {
    this.selectedRequest = request;
    this.adminNotes = '';
  }

  approveRequest() {
    if (!this.selectedRequest) return;

    this.profileUpdateRequestService.approveProfileUpdateRequest(
      this.selectedRequest.id, 
      this.adminNotes
    ).subscribe({
      next: () => {
        alert('Profile update request approved successfully!');
        this.selectedRequest = null;
        this.adminNotes = '';
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error approving request:', err);
        const errorMessage = err.message || 'Failed to approve request';
        alert('Failed to approve request: ' + errorMessage);
      }
    });
  }

  rejectRequest() {
    if (!this.selectedRequest) return;

    this.profileUpdateRequestService.rejectProfileUpdateRequest(
      this.selectedRequest.id, 
      this.adminNotes
    ).subscribe({
      next: () => {
        alert('Profile update request rejected successfully!');
        this.selectedRequest = null;
        this.adminNotes = '';
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error rejecting request:', err);
        const errorMessage = err.message || 'Failed to reject request';
        alert('Failed to reject request: ' + errorMessage);
      }
    });
  }

  closeModal() {
    this.selectedRequest = null;
    this.adminNotes = '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  }

  getRequestedDataKeys(requestedData: any): string[] {
    return Object.keys(requestedData || {});
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

  getChangedFields(request: ProfileUpdateRequest): string[] {
    if (!request.requested_data || !request.requested_data.current_data || !request.requested_data.requested_data) {
      return [];
    }
    
    const currentData = request.requested_data.current_data;
    const requestedData = request.requested_data.requested_data;
    
    // Filter out password-related fields
    const passwordFields = ['password', 'mot_de_passe', 'pwd', 'pass'];
    
    return Object.keys(requestedData).filter(key => {
      // Skip password fields
      if (passwordFields.some(pwdField => key.toLowerCase().includes(pwdField))) {
        return false;
      }
      
      const currentValue = currentData[key] || '';
      const requestedValue = requestedData[key] || '';
      return currentValue !== requestedValue;
    });
  }

  getCurrentValue(request: ProfileUpdateRequest, key: string): string {
    if (!request.requested_data || !request.requested_data.current_data) {
      return '';
    }
    return request.requested_data.current_data[key] || '';
  }

  getRequestedValue(request: ProfileUpdateRequest, key: string): string {
    if (!request.requested_data || !request.requested_data.requested_data) {
      return '';
    }
    return request.requested_data.requested_data[key] || '';
  }
} 