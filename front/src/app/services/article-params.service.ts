import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ArticleParam {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Fournisseur {
  code: string;
  responsable: string;
  // Add other fournisseur fields if needed
}

interface CreateResponse {
  id: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleParamsService {
  private apiUrl = `${environment.apiUrl}/article-params`;
  private fournisseurUrl = `${environment.apiUrl}/fournisseurs`;

  constructor(private http: HttpClient) {}

  getParams(type: string): Observable<ArticleParam[]> {
    // Map the frontend type to the correct backend route
    const routeMap: { [key: string]: string } = {
      'foyers': 'foyers',
      'indices': 'indices',
      'designs': 'designs',
      'couleur-photos': 'couleur-photos',
      'traitements': 'traitements',
      'type-articles': 'type-articles'
    };

    const route = routeMap[type] || type;
    return this.http.get<ArticleParam[]>(`${this.apiUrl}/${route}`);
  }

  getFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.fournisseurUrl);
  }

  createParam(type: string, param: Omit<ArticleParam, 'id' | 'createdAt'>): Observable<ArticleParam> {
    const routeMap: { [key: string]: string } = {
      'foyers': 'foyers',
      'indices': 'indices',
      'designs': 'designs',
      'couleur-photos': 'couleur-photos',
      'traitements': 'traitements',
      'type-articles': 'type-articles'
    };

    const route = routeMap[type] || type;
    return this.http.post<CreateResponse>(`${this.apiUrl}/${route}`, param).pipe(
      switchMap(response => this.getParams(route).pipe(
        map(params => params.find(p => p.id === response.id)!)
      ))
    );
  }

  deleteParam(type: string, id: number): Observable<void> {
    const routeMap: { [key: string]: string } = {
      'foyers': 'foyers',
      'indices': 'indices',
      'designs': 'designs',
      'couleur-photos': 'couleur-photos',
      'traitements': 'traitements',
      'type-articles': 'type-articles'
    };

    const route = routeMap[type] || type;
    return this.http.delete<void>(`${this.apiUrl}/${route}/${id}`);
  }

  importBulk(data: { [key: string]: Set<string> }): Observable<{created: number, skipped: number}> {
    // Convert Sets to arrays for JSON serialization
    const importData: { [key: string]: string[] } = {};
    Object.keys(data).forEach(key => {
      importData[key] = Array.from(data[key]);
    });
    return this.http.post<{created: number, skipped: number}>(`${this.apiUrl}/import-bulk`, importData);
  }
} 