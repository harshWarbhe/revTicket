import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Language {
  id: string;
  name: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/languages`;

  getAllLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(this.apiUrl);
  }

  initializeLanguages(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/init`, {});
  }
}
