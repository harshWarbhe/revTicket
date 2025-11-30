# API Testing Guide

## Prerequisites
You need an admin JWT token to test the admin endpoints.

## Step 1: Login as Admin
```bash
# Login to get JWT token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@revticket.com",
    "password": "admin123"
  }'
```

Save the `token` from the response.

## Step 2: Test Admin Movies Endpoints

### Get All Movies
```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:8080/api/admin/movies \
  -H "Authorization: Bearer $TOKEN"
```

### Get Movie by ID
```bash
curl -X GET http://localhost:8080/api/admin/movies/{movie_id} \
  -H "Authorization: Bearer $TOKEN"
```

### Create New Movie
```bash
curl -X POST http://localhost:8080/api/admin/movies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Movie",
    "description": "This is a test movie description with more than 10 characters",
    "genre": ["Action", "Adventure"],
    "duration": 120,
    "rating": 8.5,
    "director": "Test Director",
    "crew": ["Producer 1", "Writer 1"],
    "releaseDate": "2024-12-01",
    "posterUrl": "https://example.com/poster.jpg",
    "trailerUrl": "https://youtube.com/watch?v=test",
    "language": "English",
    "isActive": true
  }'
```

### Update Movie
```bash
curl -X PUT http://localhost:8080/api/admin/movies/{movie_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Movie",
    "description": "Updated description with more than 10 characters",
    "genre": ["Action", "Thriller"],
    "duration": 130,
    "rating": 9.0,
    "director": "Updated Director",
    "crew": ["Producer 2", "Writer 2"],
    "releaseDate": "2024-12-15",
    "posterUrl": "https://example.com/updated-poster.jpg",
    "trailerUrl": "https://youtube.com/watch?v=updated",
    "language": "English",
    "isActive": true
  }'
```

### Toggle Movie Status
```bash
curl -X PATCH http://localhost:8080/api/admin/movies/{movie_id}/status \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Movie (Soft Delete)
```bash
curl -X DELETE http://localhost:8080/api/admin/movies/{movie_id} \
  -H "Authorization: Bearer $TOKEN"
```

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "Movie Title",
    "description": "Movie description",
    "genre": ["Action", "Adventure"],
    "duration": 120,
    "rating": 8.5,
    "director": "Director Name",
    "crew": ["Crew Member 1", "Crew Member 2"],
    "releaseDate": "2024-12-01",
    "posterUrl": "https://example.com/poster.jpg",
    "trailerUrl": "https://youtube.com/watch?v=test",
    "language": "English",
    "isActive": true,
    "totalShows": 0,
    "totalBookings": 0
  },
  "message": "Movie created successfully"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "fieldErrors": {
    "title": "Title is required",
    "rating": "Rating must be between 0 and 10"
  }
}
```

## Testing from Browser Console

If you're logged in as admin in the browser, you can test from the console:

```javascript
// Get all movies
fetch('http://localhost:8080/api/admin/movies', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log);

// Create movie
fetch('http://localhost:8080/api/admin/movies', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Browser Test Movie",
    description: "Created from browser console",
    genre: ["Drama"],
    duration: 100,
    rating: 7.5,
    releaseDate: "2024-12-01",
    language: "English"
  })
})
.then(r => r.json())
.then(console.log);
```
