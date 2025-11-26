import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/profile`);
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/profile`, userData);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  changePassword(request: PasswordChangeRequest): Observable<string> {
    return this.http.put(`${environment.apiUrl}/users/change-password`, request, { responseType: 'text' });
  }
}