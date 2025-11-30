import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SeatLayout {
  rows: number;
  columns: number;
}

export interface AssignedMovie {
  id: string;
  title: string;
}

export interface Theatre {
  id: string;
  venueName: string;
}

export interface Screen {
  id: string;
  screenNumber: string;
  theatre: Theatre;
  seatingCapacity: number;
  seatLayout: SeatLayout;
  assignedMovie?: AssignedMovie;
  status: 'ACTIVE' | 'INACTIVE';
  showCount?: number;
}

export interface CreateScreenDto {
  name?: string;
  screenNumber?: string;
  theatreId: string;
  theaterId?: string;
  seatingCapacity?: number;
  totalSeats?: number;
  seatLayout?: SeatLayout;
  status?: 'ACTIVE' | 'INACTIVE';
}

@Injectable({
  providedIn: 'root'
})
export class ScreenService {
  private http = inject(HttpClient);

  getScreens(theatreId?: string): Observable<Screen[]> {
    let params = new HttpParams();
    if (theatreId) {
      params = params.set('theatreId', theatreId);
    }
    return this.http.get<Screen[]>(`${environment.apiUrl}/admin/screens`, { params });
  }

  getScreenById(id: string): Observable<Screen> {
    return this.http.get<Screen>(`${environment.apiUrl}/admin/screens/${id}`);
  }

  createScreen(screen: CreateScreenDto): Observable<Screen> {
    const payload = {
      name: screen.screenNumber || screen.name,
      theaterId: screen.theatreId || screen.theaterId,
      totalSeats: screen.seatingCapacity || screen.totalSeats || 0
    };
    return this.http.post<Screen>(`${environment.apiUrl}/admin/screens`, payload);
  }

  updateScreen(id: string, screen: Partial<CreateScreenDto>): Observable<Screen> {
    const payload = {
      name: screen.screenNumber || screen.name,
      theaterId: screen.theatreId || screen.theaterId,
      totalSeats: screen.seatingCapacity || screen.totalSeats || 0
    };
    return this.http.put<Screen>(`${environment.apiUrl}/admin/screens/${id}`, payload);
  }

  assignMovie(screenId: string, movieId: string): Observable<Screen> {
    return this.http.patch<Screen>(`${environment.apiUrl}/admin/screens/${screenId}/assign-movie`, { movieId });
  }

  updateStatus(screenId: string, status: 'ACTIVE' | 'INACTIVE'): Observable<Screen> {
    return this.http.patch<Screen>(`${environment.apiUrl}/admin/screens/${screenId}/status`, { status });
  }

  deleteScreen(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/screens/${id}`);
  }
}
