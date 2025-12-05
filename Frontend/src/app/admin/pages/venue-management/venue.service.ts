import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ScreenConfig, ScreenListItem } from './venue-management.component';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getScreensByTheatre(theatreId: string): Observable<ScreenListItem[]> {
    return this.http.get<ScreenListItem[]>(`${this.apiUrl}/admin/theatres/${theatreId}/screens`);
  }

  getScreenConfig(screenId: string): Observable<ScreenConfig> {
    return this.http.get<ScreenConfig>(`${this.apiUrl}/admin/screens/${screenId}`);
  }

  updateScreenConfig(screenId: string, config: ScreenConfig): Observable<ScreenConfig> {
    return this.http.put<ScreenConfig>(`${this.apiUrl}/admin/screens/${screenId}`, config);
  }

  createScreen(config: ScreenConfig): Observable<ScreenConfig> {
    return this.http.post<ScreenConfig>(`${this.apiUrl}/admin/screens`, config);
  }
}
