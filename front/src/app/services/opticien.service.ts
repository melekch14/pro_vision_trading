import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Opticien {
  id?: number;
  codee: string;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  role: 'opticien' | 'technicien';
}

@Injectable({
  providedIn: 'root'
})
export class OpticienService {
  private apiUrl = `${environment.apiUrl}/opticiens`;

  constructor(private http: HttpClient) { }

  getAllOpticiens(): Observable<Opticien[]> {
    return this.http.get<Opticien[]>(this.apiUrl);
  }

  getOpticienById(id: number): Observable<Opticien> {
    return this.http.get<Opticien>(`${this.apiUrl}/${id}`);
  }

  createOpticien(opticien: Opticien): Observable<any> {
    return this.http.post(this.apiUrl, opticien);
  }

  updateOpticien(id: number, opticien: Opticien): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, opticien);
  }

  deleteOpticien(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 