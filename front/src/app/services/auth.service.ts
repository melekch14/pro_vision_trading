import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface RegisterClientPayload {
  raison_social: string;
  email: string;
  password: string;
  responsable: string;
  tel: string;
  adresse: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  registerClient(data: RegisterClientPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/client`, data);
  }

  loginUser(credentials: { email: string; password: string }): Observable<any> {
  return this.http.post('http://localhost:3000/auth/login', credentials);
}

}
