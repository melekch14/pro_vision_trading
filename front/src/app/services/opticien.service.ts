import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ComponentPermission {
  componentId: string;
  componentName: string;
  hasAccess: boolean;
}

export interface Opticien {
  id?: number;
  codee: string;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  role: 'opticien' | 'technicien';
  permissions?: ComponentPermission[];
}

@Injectable({
  providedIn: 'root'
})
export class OpticienService {
  private baseUrl = `${environment.apiUrl}/opticiens`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.error || error.message;
    }
    return throwError(() => new Error(errorMessage));
  }

  getAllOpticiens(): Observable<Opticien[]> {
    return this.http.get<Opticien[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getOpticienById(id: number): Observable<Opticien> {
    return this.http.get<Opticien>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createOpticien(opticien: Opticien): Observable<Opticien> {
    return this.http.post<Opticien>(this.baseUrl, opticien).pipe(
      catchError(this.handleError)
    );
  }

  updateOpticien(id: number, opticien: Opticien): Observable<Opticien> {
    return this.http.put<Opticien>(`${this.baseUrl}/${id}`, opticien).pipe(
      catchError(this.handleError)
    );
  }

  deleteOpticien(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Methods for managing permissions
  getOpticienPermissions(id: number): Observable<ComponentPermission[]> {
    return this.http.get<ComponentPermission[]>(`${this.baseUrl}/${id}/permissions`).pipe(
      catchError(this.handleError)
    );
  }

  updateOpticienPermissions(id: number, permissions: ComponentPermission[]): Observable<ComponentPermission[]> {
    return this.http.put<ComponentPermission[]>(`${this.baseUrl}/${id}/permissions`, permissions).pipe(
      catchError(this.handleError)
    );
  }
} 