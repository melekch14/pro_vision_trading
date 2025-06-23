import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStatistics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  ordersByStatus: { status: string; count: number }[];
  lastFiveOrders: {
    id: number;
    client_name: string;
    client_tel: string;
    client_details: string;
    article_libelle: string;
    article2_libelle: string;
    products_display: string;
    price: number;
    total_price: number;
    status: string;
    payment_status: string;
    shipping_type: string;
    shipping_desc: string;
    order_datetime: string;
    product_type: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) { }

  getDashboardStatistics(): Observable<DashboardStatistics> {
    return this.http.get<DashboardStatistics>(`${this.apiUrl}/dashboard`);
  }
} 