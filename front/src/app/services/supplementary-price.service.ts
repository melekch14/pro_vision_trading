import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SupplementaryPrice {
  id?: number;
  stock_id: number;
  sphere: number;
  cylindre: number | null;
  addition: number | null;
  prix_supplement: number;
}

export interface SupplementaryPriceWithStock extends SupplementaryPrice {
  article_id: number;
  quantite: number;
  type_stock: string;
}

export interface StockWithSupplementaryPrice {
  id: number;
  article_id: number;
  sphere: number;
  cylindre: number | null;
  addition: number | null;
  quantite: number;
  prix_supplement: number | null;
  supplementary_price_id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class SupplementaryPriceService {

  private apiUrl = `${environment.apiUrl}/supplementary-prices`;

  constructor(private http: HttpClient) { }

  // Create supplementary price
  createSupplementaryPrice(priceData: SupplementaryPrice): Observable<any> {
    return this.http.post(this.apiUrl, priceData);
  }

  // Get supplementary prices for an article
  getSupplementaryPricesByArticleId(articleId: number): Observable<SupplementaryPriceWithStock[]> {
    return this.http.get<SupplementaryPriceWithStock[]>(`${this.apiUrl}/article/${articleId}`);
  }

  // Get stock entries with supplementary prices for an article
  getStockWithSupplementaryPrices(articleId: number): Observable<StockWithSupplementaryPrice[]> {
    return this.http.get<StockWithSupplementaryPrice[]>(`${this.apiUrl}/stock/${articleId}`);
  }

  // Update supplementary price
  updateSupplementaryPrice(id: number, priceData: SupplementaryPrice): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, priceData);
  }

  // Delete supplementary price
  deleteSupplementaryPrice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Get supplementary price by ID
  getSupplementaryPriceById(id: number): Observable<SupplementaryPrice> {
    return this.http.get<SupplementaryPrice>(`${this.apiUrl}/${id}`);
  }

  // Get all supplementary prices with articles
  getAllSupplementaryPricesWithArticles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
} 