import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fournisseur } from '../models/fournisseur.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {
  private apiUrl = `${environment.apiUrl}/fournisseurs`;

  constructor(private http: HttpClient) { }

  getFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.apiUrl);
  }

  getFournisseurByCode(code: string): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.apiUrl}/${code}`);
  }

  createFournisseur(fournisseur: Fournisseur): Observable<any> {
    return this.http.post(this.apiUrl, fournisseur);
  }

  updateFournisseur(code: string, fournisseur: Fournisseur): Observable<any> {
    return this.http.put(`${this.apiUrl}/${code}`, fournisseur);
  }

  deleteFournisseur(code: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${code}`);
  }
} 