import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Activity {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action: string;
  target: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityStatistics {
  totalActivities: number;
  lastWeekTotal: number;
  weekChange: number;
  activeUsers: number;
  newUsers: number;
  criticalActions: number;
  thisWeekTotal: number;
  thisWeekChange: number;
}

export interface ActivityFilters {
  action?: string;
  userId?: number;
  userRole?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityResponse {
  success: boolean;
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  user_id: number;
  user_name: string;
  user_role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityHistoryService {
  private apiUrl = `${environment.apiUrl}/activity-history`;

  constructor(private http: HttpClient) { }

  getActivities(page: number = 1, limit: number = 50, filters?: ActivityFilters): Observable<ActivityResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.action) params = params.set('action', filters.action);
      if (filters.userId) params = params.set('userId', filters.userId.toString());
      if (filters.userRole) params = params.set('userRole', filters.userRole);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get<ActivityResponse>(`${this.apiUrl}`, { params });
  }

  getActivityStatistics(): Observable<{ success: boolean } & ActivityStatistics> {
    return this.http.get<{ success: boolean } & ActivityStatistics>(`${this.apiUrl}/statistics`);
  }

  getUsers(): Observable<{ success: boolean; users: User[] }> {
    return this.http.get<{ success: boolean; users: User[] }>(`${this.apiUrl}/users`);
  }

  getActions(): Observable<{ success: boolean; actions: string[] }> {
    return this.http.get<{ success: boolean; actions: string[] }>(`${this.apiUrl}/actions`);
  }
}

