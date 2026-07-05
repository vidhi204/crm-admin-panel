import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------
  // LEADS
  // -------------------------------------------------------------
  getLeads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/leads`);
  }

  createLead(lead: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/leads`, lead);
  }

  updateLead(id: number, lead: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/leads/${id}`, lead);
  }

  deleteLead(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/leads/${id}`);
  }

  // -------------------------------------------------------------
  // CUSTOMERS
  // -------------------------------------------------------------
  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/customers`);
  }

  createCustomer(customer: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/customers`, customer);
  }

  updateCustomer(id: number, customer: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/customers/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/customers/${id}`);
  }

  // -------------------------------------------------------------
  // TASKS
  // -------------------------------------------------------------
  getTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tasks`);
  }

  createTask(task: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tasks`, task);
  }

  updateTask(id: number, task: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/tasks/${id}`, task);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/tasks/${id}`);
  }

  // -------------------------------------------------------------
  // EMPLOYEES
  // -------------------------------------------------------------
  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees`);
  }

  createEmployee(employee: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/employees`, employee);
  }

  updateEmployee(id: number, employee: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/employees/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/employees/${id}`);
  }

  // -------------------------------------------------------------
  // SETTINGS
  // -------------------------------------------------------------
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/settings`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/settings`, settings);
  }

  // -------------------------------------------------------------
  // USER ADMIN
  // -------------------------------------------------------------
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  createUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`);
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles`);
  }
}
