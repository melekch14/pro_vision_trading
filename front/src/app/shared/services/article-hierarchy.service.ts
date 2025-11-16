import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArticleGroup, ArticleFamily, ArticleSubfamily } from '../models/article-hierarchy.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleHierarchyService {
  private apiUrl = `${environment.apiUrl}/article-hierarchy`;

  constructor(private http: HttpClient) { }

  // Group operations
  createGroup(group: ArticleGroup): Observable<{ id: number, message: string }> {
    return this.http.post<{ id: number, message: string }>(`${this.apiUrl}/groups`, group);
  }

  getGroups(): Observable<ArticleGroup[]> {
    return this.http.get<ArticleGroup[]>(`${this.apiUrl}/groups`);
  }

  getGroupById(id: number): Observable<ArticleGroup> {
    return this.http.get<ArticleGroup>(`${this.apiUrl}/groups/${id}`);
  }

  updateGroup(id: number, group: ArticleGroup): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/groups/${id}`, group);
  }

  deleteGroup(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/groups/${id}`);
  }

  // Family operations
  createFamily(family: ArticleFamily): Observable<{ id: number, message: string }> {
    return this.http.post<{ id: number, message: string }>(`${this.apiUrl}/families`, family);
  }

  getFamilies(): Observable<ArticleFamily[]> {
    return this.http.get<ArticleFamily[]>(`${this.apiUrl}/families`);
  }

  getFamilyById(id: number): Observable<ArticleFamily> {
    return this.http.get<ArticleFamily>(`${this.apiUrl}/families/${id}`);
  }

  updateFamily(id: number, family: ArticleFamily): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/families/${id}`, family);
  }

  deleteFamily(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/families/${id}`);
  }

  // Subfamily operations
  createSubfamily(subfamily: ArticleSubfamily): Observable<{ id: number, message: string }> {
    return this.http.post<{ id: number, message: string }>(`${this.apiUrl}/subfamilies`, subfamily);
  }

  getSubfamilies(): Observable<ArticleSubfamily[]> {
    return this.http.get<ArticleSubfamily[]>(`${this.apiUrl}/subfamilies`);
  }

  getSubfamilyById(id: number): Observable<ArticleSubfamily> {
    return this.http.get<ArticleSubfamily>(`${this.apiUrl}/subfamilies/${id}`);
  }

  updateSubfamily(id: number, subfamily: ArticleSubfamily): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/subfamilies/${id}`, subfamily);
  }

  deleteSubfamily(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/subfamilies/${id}`);
  }

  // Import from Excel
  importFromExcel(formData: FormData): Observable<{ importedCount: number, totalRecords: number, message: string }> {
    return this.http.post<{ importedCount: number, totalRecords: number, message: string }>(`${this.apiUrl}/import`, formData);
  }
} 