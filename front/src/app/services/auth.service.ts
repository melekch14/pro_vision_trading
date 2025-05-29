import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface RegisterClientPayload {
  raison_social: string;
  email: string;
  password: string;
  responsable: string;
  tel: string;
  adresse: string;
  rccm: string;
  ninea: string;
  code_douane: string;
}

interface LoginResponse {
  token: string;
}

export interface UserData {
  id: number;
  code: string;
  email: string;
  role: string;
  raison_social?: string;
  nom?: string;
  prenom?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient) {}

  registerClient(data: RegisterClientPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/client`, data);
  }

  loginUser(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getUserData(): UserData | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload) as UserData;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  decodeAndDisplayClientInfo(): void {
    const userData = this.getUserData();
    if (userData && userData.role === 'client') {
      console.log('Client Information:');
      console.log('------------------');
      console.log('ID:', userData.id);
      console.log('Code:', userData.code);
      console.log('Email:', userData.email);
      console.log('Raison Social:', userData.raison_social);
      console.log('Role:', userData.role);
      console.log('------------------');
    }
  }
}
