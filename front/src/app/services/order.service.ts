import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  createOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData);
  }

  uploadFile(file: File, orderId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);
    
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getMatchingProducts(sphere: string, cylinder: string): Observable<any> {
    let params = new HttpParams()
      .set('sphere', sphere)
      .set('cylinder', cylinder);

    console.log('Making request to:', `${environment.apiUrl}/stock/matching`);
    console.log('With params:', { sphere, cylinder });

    return this.http.get(`${environment.apiUrl}/stock/matching`, { params });
  }
} 