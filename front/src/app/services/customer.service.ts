import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../shared/models/customer.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  // Get all customers
  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  // Get customer by ID
  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  // Create new customer
  createCustomer(customer: Customer): Observable<any> {
    return this.http.post(this.apiUrl, customer);
  }

  // Update customer
  updateCustomer(id: number, customer: Customer): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, customer);
  }

  // Delete customer
  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 