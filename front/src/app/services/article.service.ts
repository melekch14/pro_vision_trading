import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Article {
  id?: number;
  code: string;
  libelle: string;
  diametre: number;
  foyer_id: number;
  indice_id: number;
  design_id: number;
  couleur_photo_id: number;
  traitement_id: number;
  prix_achat: number;
  tva: number;
  prix_vente: number;
  code_a_barre: string;
  expiration: string;
  fournisseur_id: string;
  typeArticle_id: number;
  article_subfamily_id?: number;
  type_stock: string;
  origineArticle: 'stock' | 'fabrication';
  min_sphere?: number | null;
  max_sphere?: number | null;
  min_cylindre?: number | null;
  max_cylindre?: number | null;
  min_addition?: number | null;
  max_addition?: number | null;
  // Display names from joins
  foyer_name?: string;
  indice_name?: string;
  design_name?: string;
  couleur_photo_name?: string;
  traitement_name?: string;
  fournisseur_name?: string;
  type_article_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = `${environment.apiUrl}/articles`;

  constructor(private http: HttpClient) {}

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  getArticleById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, article);
  }

  updateArticle(id: number, article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, article);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get all data with hierarchy information
  getAllData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-data`);
  }

  // Import articles from Excel file
  importArticlesFromExcel(file: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/import`, file);
  }
} 