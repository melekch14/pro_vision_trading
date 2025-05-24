import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private baseUrl = `${environment.apiUrl}/opticiens`;
  private userPermissions: { [key: string]: boolean } = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  loadUserPermissions(): Observable<void> {
    const userData = this.authService.getUserData();
    if (!userData || userData.role !== 'opticien') {
      return of(void 0);
    }

    return this.http.get<any[]>(`${this.baseUrl}/${userData.id}/permissions`).pipe(
      map(permissions => {
        this.userPermissions = permissions.reduce((acc, perm) => {
          acc[perm.component_id] = perm.has_access;
          return acc;
        }, {} as { [key: string]: boolean });
      }),
      catchError(error => {
        console.error('Error loading permissions:', error);
        return of(void 0);
      })
    );
  }

  hasAccess(componentId: string): boolean {
    const userData = this.authService.getUserData();
    if (!userData) return false;
    
    // If user is an opticien, they have full access to everything
    if (userData.role === 'opticien') return true;
    
    // For other roles (like technicien), check their permissions
    return this.userPermissions[componentId] || false;
  }

  clearPermissions(): void {
    this.userPermissions = {};
  }
} 