# Quick Test Guide - Reviews & Ratings

## Step 1: Start MongoDB

### Option A - Windows Service (Recommended)
Double-click `START_MONGODB.bat` or run:
```cmd
net start MongoDB
```

### Option B - Manual Start
```cmd
mongod
```

### Verify MongoDB is Running
```cmd
mongosh
```
If you see MongoDB shell, it's working! Type `exit` to close.

## Step 2: Start Backend
```cmd
cd Backend
mvn spring-boot:run
```

Wait for: `Started RevTicketApplication`

## Step 3: Start Frontend
```cmd
cd Frontend
ng serve
```

Open: http://localhost:4200

## Step 4: Test as User

1. **Login as User**
   - Go to http://localhost:4200
   - Login or signup

2. **View Movie Details**
   - Click on any movie
   - Scroll down to see "Reviews & Ratings" section

3. **Submit a Review**
   - Click "Write a Review"
   - Select rating (1-5 stars)
   - Write comment
   - Click "Submit Review"
   - You'll see: "Review submitted! It will be visible after admin approval."

## Step 5: Test as Admin

1. **Login as Admin**
   - Logout from user account
   - Login with admin credentials

2. **View Pending Reviews**
   - Click "Reviews" (⭐) in admin sidebar
   - You'll see all pending reviews

3. **Approve Review**
   - Click "Approve" button
   - Review disappears from pending list

4. **Verify Review is Public**
   - Logout from admin
   - Login as user (or view without login)
   - Go to the same movie
   - Scroll to reviews section
   - Your approved review is now visible!

## Troubleshooting

### "No reviews yet" showing
- Reviews need admin approval first
- Check admin panel for pending reviews

### Backend error on submit
- Ensure MongoDB is running: `mongosh`
- Check backend console for errors
- Verify connection: `mongodb://localhost:27017/revticket_reviews`

### Can't see Reviews section
- Clear browser cache
- Restart frontend: `ng serve`
- Check browser console for errors

### "Already reviewed" error
- Each user can only review a movie once
- Use different user account or different movie

## Expected Flow

```
User submits review → Stored in MongoDB (approved=false)
                    ↓
Admin sees in pending reviews
                    ↓
Admin clicks "Approve" → Review updated (approved=true)
                    ↓
Review appears on movie details page for all users
```

## MongoDB Data Check

To verify data in MongoDB:
```bash
mongosh
use revticket_reviews
db.reviews.find().pretty()
```

You should see your reviews with fields:
- userId, userName
- movieId, movieTitle
- rating, comment
- approved (true/false)
- createdAt

## Success Indicators

✅ MongoDB running on port 27017
✅ Backend started without errors
✅ Frontend compiled successfully
✅ Reviews section visible on movie details
✅ "Write a Review" button appears when logged in
✅ Admin can see pending reviews
✅ Approved reviews appear on movie page
