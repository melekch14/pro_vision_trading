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

  getMatchingProductsBySphereAndAddition(sphere: string, addition: string): Observable<any> {
    let params = new HttpParams()
      .set('sphere', sphere)
      .set('addition', addition);

    console.log('Making request to:', `${environment.apiUrl}/stock/matching-by-addition`);
    console.log('With params:', { sphere, addition });

    return this.http.get(`${environment.apiUrl}/stock/matching-by-addition`, { params });
  }

  getStockById(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/stock/${id}`);
  }

  getArticleById(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/articles/${id}`);
  }

  getClientOrders(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/client/${clientId}`);
  }

  getAllOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getOrderById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
} 