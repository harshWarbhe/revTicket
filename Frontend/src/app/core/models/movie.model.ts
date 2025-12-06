export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string[];
  duration: number;
  rating: number;
  director?: string;
  crew?: string[];
  releaseDate: Date;
  posterUrl: string;
  backgroundUrl?: string;
  trailerUrl?: string;
  language: string;
  isActive: boolean;
  totalShows?: number;
  totalBookings?: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  theaterName: string;
  theaterIcon?: string;
  showDate: Date;
  showTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}