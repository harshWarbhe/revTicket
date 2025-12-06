import { Injectable, signal, effect } from '@angular/core';

export interface City {
  name: string;
  state: string;
}

const INDIAN_CITIES: City[] = [
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' }
];

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly STORAGE_KEY = 'selectedCity';
  private readonly LOCATION_PROMPTED_KEY = 'locationPrompted';

  selectedCity = signal<string | null>(this.loadFromStorage());
  cities = signal<City[]>(INDIAN_CITIES);
  detectionError = signal<string | null>(null);
  isDetecting = signal(false);
  hasPrompted = signal<boolean>(this.hasBeenPrompted());

  constructor() {
    effect(() => {
      const city = this.selectedCity();
      if (city) {
        localStorage.setItem(this.STORAGE_KEY, city);
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  setCity(city: string): void {
    this.selectedCity.set(city);
    this.detectionError.set(null);
    this.markAsPrompted();
  }

  clearCity(): void {
    this.selectedCity.set(null);
  }

  markAsPrompted(): void {
    localStorage.setItem(this.LOCATION_PROMPTED_KEY, 'true');
    this.hasPrompted.set(true);
  }

  private hasBeenPrompted(): boolean {
    return localStorage.getItem(this.LOCATION_PROMPTED_KEY) === 'true';
  }

  async detectLocation(): Promise<void> {
    this.isDetecting.set(true);
    this.detectionError.set(null);

    if (!navigator.geolocation) {
      this.detectionError.set('Geolocation is not supported by your browser');
      this.isDetecting.set(false);
      return;
    }

    try {
      const position = await this.getCurrentPosition();
      const city = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
      if (city) {
        this.selectedCity.set(city);
        this.markAsPrompted();
      }
    } catch (error: any) {
      if (error.code === 1) {
        this.detectionError.set('Location access denied. Please select manually');
      } else {
        this.detectionError.set('Unable to detect your location. Please choose manually');
      }
    } finally {
      this.isDetecting.set(false);
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: true
      });
    });
  }

  private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      const detectedCity = data.city || data.locality || data.principalSubdivision;
      
      if (!detectedCity) {
        return null;
      }
      
      const matchedCity = INDIAN_CITIES.find(c => 
        detectedCity.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(detectedCity.toLowerCase())
      );
      
      return matchedCity ? matchedCity.name : null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  private loadFromStorage(): string | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && INDIAN_CITIES.some(c => c.name === stored)) {
      return stored;
    }
    return null;
  }

  getCityList(): City[] {
    return INDIAN_CITIES;
  }
}
