# RevTicket Project - Team Distribution Plan

## Team Member 1: Authentication & User Management
**Focus: User Authentication, Registration, and Profile Management**

### Pages/Components:
1. **Auth Module (4 components)**
   - Login (`auth/login/`)
   - Signup (`auth/signup/`)
   - Forgot Password (`auth/forgot-password/`)
   - Reset Password (`auth/reset-password/`)

2. **User Profile Management (1 component)**
   - User Profile (`user/pages/profile/`)

3. **Shared Components (2 components)**
   - Navbar (`shared/components/navbar/`)
   - Auth Debug (`shared/components/auth-debug/`)

**Total: 7 components**

---

## Team Member 2: User Movie Experience
**Focus: Movie Discovery, Details, and Booking Flow**

### Pages/Components:
1. **User Movie Pages (4 components)**
   - Home (`user/pages/home/`)
   - All Movies (`user/pages/all-movies/`)
   - Movie Details (`user/pages/movie-details/`)
   - Showtimes (`user/pages/showtimes/`)

2. **Movie Components (5 components)**
   - Hero Banner (`user/components/hero-banner/`)
   - Hero Slider (`user/components/hero-slider/`)
   - Movie Carousel (`user/components/movie-carousel/`)
   - Movie Slider (`user/components/movie-slider/`)
   - Theatre Slider (`user/components/theatre-slider/`)

3. **Shared Movie Components (2 components)**
   - Movie Card (`shared/components/movie-card/`)
   - Movie Reviews (`shared/components/movie-reviews/`)

**Total: 11 components**

---

## Team Member 3: Booking & Payment System
**Focus: Seat Selection, Payment, and Booking Management**

### Pages/Components:
1. **Booking Flow Pages (5 components)**
   - Seat Booking (`user/pages/seat-booking/`)
   - Booking Summary (`user/pages/booking-summary/`)
   - Payment (`user/pages/payment/`)
   - Booking Success (`user/pages/booking-success/`)
   - My Bookings (`user/pages/my-bookings/`)

2. **Booking Components (3 components)**
   - Date Selector (`user/components/date-selector/`)
   - Showtime Card (`user/components/showtime-card/`)
   - E-Ticket (`user/components/e-ticket/`)

3. **Shared Components (1 component)**
   - Seat Layout (`shared/components/seat-layout/`)

**Total: 9 components**

---

## Team Member 4: Admin Panel & Management
**Focus: Admin Dashboard, Content Management, and System Administration**

### Pages/Components:
1. **Admin Pages (11 components)**
   - Dashboard (`admin/pages/dashboard/`)
   - Add Movie (`admin/pages/add-movie/`)
   - Manage Movies (`admin/pages/manage-movies/`)
   - Manage Shows (`admin/pages/manage-shows/`)
   - Manage Theatres (`admin/pages/manage-theatres/`)
   - Screens (`admin/pages/screens/`)
   - Bookings (`admin/pages/bookings/`)
   - Bookings Report (`admin/pages/bookings-report/`)
   - Users (`admin/pages/users/`)
   - Profile (`admin/pages/profile/`)
   - Settings (`admin/pages/settings/`)

2. **Admin Layout & Navigation (3 components)**
   - Admin Layout (`admin/layout/admin-layout/`)
   - Admin Sidebar (`admin/components/admin-sidebar/`)
   - Admin Navbar (within admin-sidebar folder)

3. **Shared Components (3 components)**
   - Alert (`shared/components/alert/`)
   - Loader (`shared/components/loader/`)
   - Footer (`shared/components/footer/`)

**Total: 17 components**

---

## Summary by Team Member:

| Team Member | Focus Area | Component Count | Key Responsibilities |
|-------------|------------|-----------------|---------------------|
| **Member 1** | Auth & User Management | 7 | Login, Registration, User Profile, Navigation |
| **Member 2** | Movie Experience | 11 | Movie Discovery, Details, Home Page, Sliders |
| **Member 3** | Booking & Payment | 9 | Seat Selection, Payment Flow, Ticket Management |
| **Member 4** | Admin Panel | 17 | Admin Dashboard, Content Management, Reports |

**Total Components: 44**

---

## Additional Responsibilities:

### Backend API Integration:
- **Member 1**: Auth APIs, User Management APIs
- **Member 2**: Movie APIs, Review APIs, Theater APIs
- **Member 3**: Booking APIs, Payment APIs, Seat APIs
- **Member 4**: Admin APIs, Dashboard APIs, Report APIs

### Core Services (Shared):
- **Member 1**: `auth.service.ts`, `user.service.ts`
- **Member 2**: `movie.service.ts`, `theater.service.ts`, `review.service.ts`
- **Member 3**: `booking.service.ts`, `payment.service.ts`, `seat.service.ts`
- **Member 4**: `admin.service.ts`, `admin-user.service.ts`, `showtime.service.ts`

### Guards & Interceptors:
- **Member 1**: `auth.guard.ts`, `token.interceptor.ts`
- **Member 4**: `admin.guard.ts`, `user.guard.ts`, `error.interceptor.ts`

---

## Coordination Points:

1. **Shared Models**: All members should coordinate on model updates
2. **Routing**: Member 1 handles main routing, others handle module-specific routes
3. **Styling**: Consistent theme across all components
4. **Testing**: Each member tests their assigned components
5. **Integration**: Regular integration testing between modules

---

## Timeline Suggestions:

### Week 1-2: Foundation
- Member 1: Authentication system
- Member 2: Basic movie display
- Member 3: Basic booking flow
- Member 4: Admin dashboard structure

### Week 3-4: Core Features
- Member 1: User profile management
- Member 2: Movie details and search
- Member 3: Seat selection and payment
- Member 4: Content management

### Week 5-6: Advanced Features & Integration
- All members: Integration testing and bug fixes
- Member 4: Reports and analytics
- All: UI/UX improvements

### Week 7: Testing & Deployment
- All members: Final testing and deployment preparation