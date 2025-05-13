import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ArticleParam {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleParamsService {
  private apiUrl = `${environment.apiUrl}/article-params`;

  constructor(private http: HttpClient) {}

  getParams(type: string): Observable<ArticleParam[]> {
    // Map the frontend type to the correct backend route
    const routeMap: { [key: string]: string } = {
      'foyers': 'foyers',
      'indices': 'indices',
      'designs': 'designs',
      'couleur-photos': 'couleur-photos',
      'traitements': 'traitements'
    };

    const route = routeMap[type] || type;
    return this.http.get<ArticleParam[]>(`${this.apiUrl}/${route}`);
  }

  createParam(type: string, param: Omit<ArticleParam, 'id' | 'createdAt'>): Observable<ArticleParam> {
    const routeMap: { [key: string]: string } = {
      'foyers': 'foyers',
      'indices': 'indices',
      'designs': 'designs',
      'couleur-photos': 'couleur-photos',
      'traitements': 'traitements'
    };

    const route = routeMap[type] || type;
    return this.http.post<ArticleParam>(`${this.apiUrl}/${route}`, param);
  }

  deleteParam(type: string, id: number): Observable<void> {
    const routeMap: { [key: string]: string } = {
      'foyers': 'foyers',
      'indices': 'indices',
      'designs': 'designs',
      'couleur-photos': 'couleur-photos',
      'traitements': 'traitements'
    };

    const route = routeMap[type] || type;
    return this.http.delete<void>(`${this.apiUrl}/${route}/${id}`);
  }
} 