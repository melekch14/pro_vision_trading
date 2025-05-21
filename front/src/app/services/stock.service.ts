import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StockEntry {
  id?: number;
  article_id: number;
  sphere: number;
  cylindre: number;
  quantite: number;
}

export interface StockEntryWithArticle extends StockEntry {
  article_code: string;
  article_libelle: string;
  subfamily_name: string;
  subfamily_code: string;
  family_code: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  getAllStockWithArticles(): Observable<StockEntryWithArticle[]> {
    return this.http.get<StockEntryWithArticle[]>(`${this.apiUrl}/all`);
  }

  getStockByArticleId(articleId: number): Observable<StockEntry[]> {
    return this.http.get<StockEntry[]>(`${this.apiUrl}/article/${articleId}`);
  }

  createStock(stockEntry: StockEntry): Observable<StockEntry> {
    return this.http.post<StockEntry>(this.apiUrl, stockEntry);
  }

  updateStock(id: number, stockEntry: StockEntry): Observable<StockEntry> {
    return this.http.put<StockEntry>(`${this.apiUrl}/${id}`, stockEntry);
  }

  deleteStock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStockById(id: number): Observable<StockEntry> {
    return this.http.get<StockEntry>(`${this.apiUrl}/${id}`);
  }
} 