# Admin Manage Movies - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Angular 18)                    │
│                     http://localhost:4200                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Manage Movies Component (manage-movies.component.ts)     │  │
│  │  - Uses signals for reactive state                        │  │
│  │  - Computed signals for filtering                         │  │
│  │  - TrackBy for *ngFor optimization                        │  │
│  │  - Optimistic updates with rollback                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Movie Service (movie.service.ts)                         │  │
│  │  - HTTP client wrapper                                    │  │
│  │  - API response unwrapping                                │  │
│  │  - Type-safe observables                                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTTP Interceptors                                        │  │
│  │  - Token Interceptor (adds JWT to headers)               │  │
│  │  - Error Interceptor (handles HTTP errors)               │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │ Authorization: Bearer <JWT>
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                    BACKEND (Spring Boot 3.2.0)                   │
│                     http://localhost:8080                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Security Filter Chain                                    │  │
│  │  - JWT Authentication Filter                              │  │
│  │  - CORS Configuration                                     │  │
│  │  - Role-based access control                             │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Admin Movie Controller (AdminMovieController.java)      │  │
│  │  @PreAuthorize("hasRole('ADMIN')")                       │  │
│  │  - GET    /api/admin/movies                              │  │
│  │  - GET    /api/admin/movies/{id}                         │  │
│  │  - POST   /api/admin/movies                              │  │
│  │  - PUT    /api/admin/movies/{id}                         │  │
│  │  - PATCH  /api/admin/movies/{id}/status                  │  │
│  │  - DELETE /api/admin/movies/{id}                         │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Movie Service (MovieService.java)                       │  │
│  │  - Business logic                                         │  │
│  │  - DTO conversion                                         │  │
│  │  - Data validation                                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Movie Repository (MovieRepository.java)                 │  │
│  │  - JPA Repository                                         │  │
│  │  - Custom queries                                         │  │
│  │  - findByIsActiveTrue()                                   │  │
│  │  - countShowtimesByMovieId()                             │  │
│  │  - countBookingsByMovieId()                              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Global Exception Handler                                │  │
│  │  - Validation errors                                      │  │
│  │  - Runtime errors                                         │  │
│  │  - Authentication errors                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ JDBC
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                      DATABASE (MySQL 8.0)                        │
│                     jdbc:mysql://localhost:3306/revticket_db     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  movies                                                   │  │
│  │  - id (VARCHAR(36) PRIMARY KEY)                          │  │
│  │  - title (VARCHAR(255) NOT NULL)                         │  │
│  │  - description (TEXT)                                     │  │
│  │  - duration (INT NOT NULL)                               │  │
│  │  - rating (DOUBLE)                                        │  │
│  │  - director (VARCHAR(255))                               │  │
│  │  - release_date (DATE NOT NULL)                          │  │
│  │  - poster_url (VARCHAR(500))                             │  │
│  │  - trailer_url (VARCHAR(500))                            │  │
│  │  - language (VARCHAR(50))                                │  │
│  │  - is_active (TINYINT(1) DEFAULT 1)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  movie_genres                                             │  │
│  │  - movie_id (VARCHAR(36) FK -> movies.id)                │  │
│  │  - genre (VARCHAR(100))                                   │  │
│  │  - PRIMARY KEY (movie_id, genre)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  movie_crew                                               │  │
│  │  - movie_id (VARCHAR(36) FK -> movies.id)                │  │
│  │  - crew_member (VARCHAR(255))                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Load Movies (GET)
```
User opens page
    ↓
Component.ngOnInit()
    ↓
MovieService.getAdminMovies()
    ↓
HTTP GET /api/admin/movies
    ↓
JWT Token Interceptor adds Authorization header
    ↓
Backend Security Filter validates JWT
    ↓
AdminMovieController.getAllMovies()
    ↓
MovieService.getAllMoviesForAdmin()
    ↓
MovieRepository.findAll()
    ↓
MySQL: SELECT * FROM movies
    ↓
JPA loads genres from movie_genres
    ↓
JPA loads crew from movie_crew
    ↓
MovieService converts to DTO
    ↓
Controller wraps in ApiResponse
    ↓
HTTP Response: { success: true, data: [...], message: "..." }
    ↓
Frontend unwraps response
    ↓
Component updates signal
    ↓
UI re-renders with movies
```

### 2. Create Movie (POST)
```
User fills form and clicks "Add Movie"
    ↓
Component.onSubmit()
    ↓
Form validation (frontend)
    ↓
MovieService.addMovie(movieData)
    ↓
HTTP POST /api/admin/movies
    ↓
Backend Security Filter validates JWT
    ↓
AdminMovieController.createMovie(@Valid MovieRequest)
    ↓
Bean Validation checks @NotBlank, @Min, @Max, etc.
    ↓
MovieService.createMovie(request)
    ↓
Create Movie entity
    ↓
MovieRepository.save(movie)
    ↓
MySQL: INSERT INTO movies (...)
    ↓
MySQL: INSERT INTO movie_genres (...)
    ↓
MySQL: INSERT INTO movie_crew (...)
    ↓
MovieService converts to DTO
    ↓
Controller wraps in ApiResponse
    ↓
HTTP Response: { success: true, data: {...}, message: "Movie created" }
    ↓
Frontend shows success alert
    ↓
Navigate to manage-movies
    ↓
Reload movies list
```

### 3. Update Movie (PUT)
```
User clicks edit button
    ↓
Navigate to /admin/add-movie?id={movieId}
    ↓
Component loads movie via getAdminMovieById()
    ↓
Form populated with existing data
    ↓
User modifies fields and clicks "Update Movie"
    ↓
Component.onSubmit()
    ↓
MovieService.updateMovie(id, movieData)
    ↓
HTTP PUT /api/admin/movies/{id}
    ↓
Backend validates and updates
    ↓
MySQL: UPDATE movies SET ... WHERE id = ?
    ↓
MySQL: DELETE FROM movie_genres WHERE movie_id = ?
    ↓
MySQL: INSERT INTO movie_genres (...)
    ↓
MySQL: DELETE FROM movie_crew WHERE movie_id = ?
    ↓
MySQL: INSERT INTO movie_crew (...)
    ↓
Response with updated movie
    ↓
Frontend shows success alert
    ↓
Navigate back to manage-movies
```

### 4. Toggle Status (PATCH)
```
User clicks status toggle button
    ↓
Component.toggleMovieStatus(movie)
    ↓
Optimistic update (UI changes immediately)
    ↓
MovieService.toggleMovieStatus(id)
    ↓
HTTP PATCH /api/admin/movies/{id}/status
    ↓
Backend toggles isActive flag
    ↓
MySQL: UPDATE movies SET is_active = !is_active WHERE id = ?
    ↓
Response with updated movie
    ↓
Frontend confirms change
    ↓
Success alert shown
    ↓
(On error: rollback optimistic update)
```

### 5. Delete Movie (DELETE)
```
User clicks delete button
    ↓
Confirmation dialog shown
    ↓
User confirms
    ↓
Component.deleteMovie(movie)
    ↓
MovieService.deleteMovie(id)
    ↓
HTTP DELETE /api/admin/movies/{id}
    ↓
Backend soft deletes (sets isActive=false)
    ↓
MySQL: UPDATE movies SET is_active = 0 WHERE id = ?
    ↓
Response: { success: true, message: "Movie deleted" }
    ↓
Frontend shows success alert
    ↓
Reload movies list
    ↓
Movie no longer visible (unless "Show Inactive" is on)
```

## Component Structure

```
manage-movies.component.ts
├── Signals (State)
│   ├── movies: Signal<Movie[]>
│   ├── searchTerm: Signal<string>
│   ├── selectedGenre: Signal<string>
│   ├── showInactive: Signal<boolean>
│   ├── loading: Signal<boolean>
│   ├── deletingId: Signal<string | null>
│   ├── sortField: Signal<string>
│   ├── sortDir: Signal<'asc' | 'desc'>
│   └── togglingStatusId: Signal<string | null>
│
├── Computed Signals
│   ├── availableGenres: computed(() => unique genres from movies)
│   └── filteredMovies: computed(() => filtered and sorted movies)
│
├── Methods
│   ├── ngOnInit() - Load movies on component init
│   ├── loadMovies() - Fetch movies from API
│   ├── editMovie(movie) - Navigate to edit form
│   ├── deleteMovie(movie) - Delete with confirmation
│   ├── toggleMovieStatus(movie) - Toggle active/inactive
│   ├── sortBy(field) - Sort movies by field
│   ├── toggleInactiveFilter() - Toggle show inactive
│   ├── getDirector(movie) - Get director or 'N/A'
│   ├── formatReleaseDate(date) - Format date for display
│   ├── onImageError(event) - Handle poster load error
│   └── trackById(index, item) - TrackBy for *ngFor
│
└── Dependencies (injected)
    ├── Router - Navigation
    ├── MovieService - API calls
    └── AlertService - Show alerts
```

## Security Flow

```
1. User Login
   ↓
2. Backend generates JWT token
   ↓
3. Frontend stores token in localStorage
   ↓
4. Token Interceptor adds token to all requests
   ↓
5. Backend validates token on each request
   ↓
6. Backend checks user role (ADMIN required)
   ↓
7. If valid: Process request
   If invalid: Return 401 Unauthorized
   ↓
8. Error Interceptor catches 401
   ↓
9. Redirect to login page
```

## Error Handling Flow

```
Frontend Validation
    ↓
    ├─ Valid → Send to backend
    └─ Invalid → Show field errors
                 ↓
Backend Validation (@Valid)
    ↓
    ├─ Valid → Process request
    └─ Invalid → Return 400 with field errors
                 ↓
Business Logic
    ↓
    ├─ Success → Return 200 with data
    └─ Error → Throw exception
                 ↓
Global Exception Handler
    ↓
    └─ Return appropriate HTTP status with error message
                 ↓
Frontend Error Interceptor
    ↓
    └─ Show user-friendly alert
```

## Performance Considerations

### Current Implementation
- **Client-side filtering**: All movies loaded, filtered in browser
- **Client-side sorting**: Sorting done in computed signal
- **Optimistic updates**: UI updates before server confirms
- **Signal-based reactivity**: Efficient change detection

### Scalability
- Works well for < 1000 movies
- For larger datasets, consider:
  - Server-side pagination
  - Server-side filtering
  - Virtual scrolling
  - Lazy loading

## Technology Stack

### Frontend
- **Angular**: 18.x (latest)
- **TypeScript**: 5.x
- **RxJS**: 7.x (Observables)
- **Signals**: Angular 18 reactive primitives
- **Standalone Components**: No NgModules

### Backend
- **Spring Boot**: 3.2.0
- **Spring Security**: JWT authentication
- **Spring Data JPA**: Database access
- **Hibernate**: ORM
- **Jakarta Validation**: Bean validation
- **Lombok**: Reduce boilerplate

### Database
- **MySQL**: 8.0
- **InnoDB**: Storage engine
- **UTF-8**: Character set

### Build Tools
- **Frontend**: Angular CLI, npm
- **Backend**: Maven
- **Database**: MySQL CLI

## Deployment Architecture

```
Production Environment:

┌─────────────────────────────────────────┐
│  Load Balancer (Nginx/Apache)           │
│  - SSL/TLS termination                   │
│  - Static file serving                   │
│  - Reverse proxy                         │
└────────────┬────────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
┌────────────▼──────────┐    ┌────────────▼──────────┐
│  Frontend (Angular)    │    │  Backend (Spring Boot) │
│  - Compiled to static  │    │  - JAR file            │
│  - Served by Nginx     │    │  - Tomcat embedded     │
│  - CDN for assets      │    │  - Multiple instances  │
└────────────────────────┘    └────────────┬───────────┘
                                           │
                              ┌────────────▼───────────┐
                              │  Database (MySQL)      │
                              │  - Master-Slave setup  │
                              │  - Automated backups   │
                              │  - Connection pooling  │
                              └────────────────────────┘
```

## Monitoring & Logging

### Frontend
- Browser console errors
- Network tab for API calls
- Angular DevTools for debugging

### Backend
- Spring Boot Actuator endpoints
- Log4j2 for application logs
- Exception tracking in GlobalExceptionHandler

### Database
- MySQL slow query log
- Performance schema
- Binary logs for replication

---

*This architecture document provides a comprehensive overview of the Admin Manage Movies system.*
