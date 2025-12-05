# MongoDB Setup for Reviews System

## Prerequisites
- MongoDB installed on your system
- MongoDB running on default port 27017

## Installation

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install MongoDB with default settings
3. MongoDB will run as a Windows service automatically

### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Mac (using Homebrew)
brew install mongodb-community
```

## Start MongoDB

### Windows
MongoDB runs automatically as a service. To check status:
```cmd
net start MongoDB
```

### Linux/Mac
```bash
# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

## Verify MongoDB is Running

```bash
# Connect to MongoDB shell
mongosh

# Or using legacy mongo shell
mongo
```

## Database Configuration

The application will automatically create the database `revticket_reviews` and the `reviews` collection when you first add a review.

### Connection String
```
mongodb://localhost:27017/revticket_reviews
```

This is already configured in `application.properties`:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/revticket_reviews
spring.data.mongodb.auto-index-creation=true
```

## Features

### User Features
- Submit movie reviews with ratings (1-5 stars)
- View approved reviews for movies
- See average ratings for movies
- One review per user per movie

### Admin Features
- View all pending reviews
- Approve reviews to make them public
- Delete inappropriate reviews
- View all reviews for specific movies

## API Endpoints

### User Endpoints
- `POST /api/reviews` - Submit a review
- `GET /api/reviews/movie/{movieId}` - Get approved reviews for a movie
- `GET /api/reviews/movie/{movieId}/average` - Get average rating

### Admin Endpoints (Requires ADMIN role)
- `GET /api/admin/reviews/pending` - Get all pending reviews
- `GET /api/admin/reviews/movie/{movieId}` - Get all reviews for a movie
- `PATCH /api/admin/reviews/{reviewId}/approve` - Approve a review
- `DELETE /api/admin/reviews/{reviewId}` - Delete a review

## Testing

1. Start MongoDB
2. Start the Spring Boot backend
3. Start the Angular frontend
4. Login as a user and navigate to a movie details page
5. Submit a review
6. Login as admin and go to Reviews section
7. Approve or delete the review

## Troubleshooting

### MongoDB Connection Error
If you see connection errors:
1. Ensure MongoDB is running: `mongosh` or `mongo`
2. Check if port 27017 is available
3. Verify connection string in application.properties

### Reviews Not Showing
- Reviews must be approved by admin before appearing to users
- Check admin panel for pending reviews

## Data Model

```javascript
{
  "_id": "ObjectId",
  "userId": "string",
  "userName": "string",
  "movieId": "string",
  "movieTitle": "string",
  "rating": "number (1-5)",
  "comment": "string",
  "createdAt": "ISODate",
  "approved": "boolean"
}
```

## Indexes
- Compound unique index on (userId, movieId) - prevents duplicate reviews
- Index on movieId for fast queries
- Index on approved status for admin queries
