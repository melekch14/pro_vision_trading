import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Bl, BlStatistics, BlImportResult, BlSearchResult } from '../models/bl.model';

@Injectable({
  providedIn: 'root'
})
export class BlService {
  private apiUrl = `${environment.apiUrl}/bl`;

  constructor(private http: HttpClient) { }

  // Get all BL records
  getAllBl(): Observable<Bl[]> {
    return this.http.get<Bl[]>(this.apiUrl);
  }

  // Get BL by ID
  getBlById(id: string): Observable<Bl> {
    return this.http.get<Bl>(`${this.apiUrl}/${id}`);
  }

  // Create a new BL record
  createBl(blData: Partial<Bl>): Observable<any> {
    return this.http.post(this.apiUrl, blData);
  }

  // Update BL record
  updateBl(id: string, blData: Partial<Bl>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, blData);
  }

  // Delete BL record
  deleteBl(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Import BL data from Excel file
  importBlFromExcel(file: File): Observable<BlImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<BlImportResult>(`${this.apiUrl}/import`, formData);
  }

  // Search BL records
  searchBl(searchTerm: string): Observable<BlSearchResult> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<BlSearchResult>(`${this.apiUrl}/search`, { params });
  }

  // Get BL statistics
  getBlStatistics(): Observable<BlStatistics> {
    return this.http.get<BlStatistics>(`${this.apiUrl}/statistics`);
  }
}
