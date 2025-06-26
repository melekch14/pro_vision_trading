import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProfileUpdateRequest {
  id: number;
  client_id: number;
  requested_data: {
    current_data: any;
    requested_data: any;
  };
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  raison_social?: string;
  email?: string;
  responsable?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileUpdateRequestService {
  private apiUrl = `${environment.apiUrl}/profile-update-requests`;

  constructor(private http: HttpClient) {}

  // Helper method to parse JSON data
  private parseRequestedData(request: ProfileUpdateRequest): ProfileUpdateRequest {
    if (typeof request.requested_data === 'string') {
      try {
        request.requested_data = JSON.parse(request.requested_data);
      } catch (e) {
        console.error('Failed to parse requested_data:', e);
        request.requested_data = { current_data: {}, requested_data: {} };
      }
    }
    return request;
  }

  // Create a new profile update request
  createProfileUpdateRequest(clientId: number, requestedData: any): Observable<any> {
    return this.http.post(this.apiUrl, { clientId, requestedData });
  }

  // Get all profile update requests (admin)
  getAllProfileUpdateRequests(): Observable<ProfileUpdateRequest[]> {
    return this.http.get<ProfileUpdateRequest[]>(this.apiUrl).pipe(
      map(requests => requests.map(request => this.parseRequestedData(request)))
    );
  }

  // Get profile update requests by status (admin)
  getProfileUpdateRequestsByStatus(status: string): Observable<ProfileUpdateRequest[]> {
    return this.http.get<ProfileUpdateRequest[]>(`${this.apiUrl}/status/${status}`).pipe(
      map(requests => requests.map(request => this.parseRequestedData(request)))
    );
  }

  // Get profile update request by ID
  getProfileUpdateRequestById(id: number): Observable<ProfileUpdateRequest> {
    return this.http.get<ProfileUpdateRequest>(`${this.apiUrl}/${id}`).pipe(
      map(request => this.parseRequestedData(request))
    );
  }

  // Get pending requests for a specific client
  getPendingRequestsByClientId(clientId: number): Observable<ProfileUpdateRequest[]> {
    return this.http.get<ProfileUpdateRequest[]>(`${this.apiUrl}/client/${clientId}/pending`).pipe(
      map(requests => requests.map(request => this.parseRequestedData(request)))
    );
  }

  // Approve a profile update request (admin)
  approveProfileUpdateRequest(requestId: number, adminNotes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${requestId}/approve`, { adminNotes }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error approving request:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to approve request';
        throw new Error(errorMessage);
      })
    );
  }

  // Reject a profile update request (admin)
  rejectProfileUpdateRequest(requestId: number, adminNotes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${requestId}/reject`, { adminNotes }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error rejecting request:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to reject request';
        throw new Error(errorMessage);
      })
    );
  }

  // Delete a profile update request
  deleteProfileUpdateRequest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 