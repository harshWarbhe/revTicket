# Venue Management System

## Overview
The Venue Management system is a unified Angular 18 component that merges the functionality of the previous `manage-theatres` and `screens` components into a single, modern, and user-friendly interface.

## Features

### 🏢 Theatre Management
- **List all theatres** with search and filtering capabilities
- **Add/Edit theatres** with comprehensive form validation
- **Toggle theatre status** (Active/Inactive) with real-time updates
- **Delete theatres** with confirmation dialogs
- **Responsive design** that works on all device sizes

### 🎬 Screen Management
- **Expandable theatre cards** showing screens inline
- **Screen configuration** with seat layout editor
- **Category management** with color-coded pricing
- **Quick assign** functionality for bulk seat categorization
- **Real-time preview** of seat layouts
- **Drag-and-drop** style seat management

### 🎯 Key Improvements
- **Unified Interface**: Single page for all venue operations
- **Modern UI/UX**: Clean cards, animations, and responsive design
- **Angular 18 Features**: Signals, @for loops, @if conditions, standalone components
- **Better Navigation**: Direct URLs for specific theatre/screen configurations
- **Mobile Optimized**: Touch-friendly interface with collapsible sections

## Component Structure

```
venue-management/
├── venue-management.component.ts     # Main component with state management
├── venue-management.component.html   # Main template with Angular 18 syntax
├── venue-management.component.scss   # Modern styling with animations
├── subcomponents/
│   ├── theatre-item.component.ts     # Individual theatre card component
│   └── screen-config.component.ts    # Screen configuration component
└── README.md                         # This documentation
```

## Routing

### New Routes
- `/admin/venues` - Main venue management page
- `/admin/venues/:theatreId` - Expanded view of specific theatre
- `/admin/venues/:theatreId/:screenId` - Screen configuration view

### Legacy Redirects
- `/admin/manage-theatres` → `/admin/venues`
- `/admin/screens` → `/admin/venues`

## Angular 18 Features Used

### Control Flow
```typescript
// Old ngFor
*ngFor="let theatre of theatres; track theatre.id"

// New @for
@for (theatre of theatres(); track theatre.id) {
  // content
}
```

### Signals
```typescript
// Reactive state management
theatres = signal<Theater[]>([]);
loading = signal(false);
expandedTheatreId = signal<string | null>(null);

// Computed values
totalSeats = computed(() => this.seatMap().filter(s => s.status !== 'disabled').length);
```

### Standalone Components
```typescript
@Component({
  selector: 'app-venue-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TheatreItemComponent, ScreenConfigComponent],
  // ...
})
```

## API Integration

### Theatre Operations
- `GET /theaters` - List all theatres
- `POST /theaters` - Create new theatre
- `PUT /theaters/:id` - Update theatre
- `DELETE /admin/theatres/:id` - Delete theatre
- `PUT /admin/theatres/:id/pause` - Deactivate theatre
- `PUT /admin/theatres/:id/resume` - Activate theatre

### Screen Operations
- `GET /admin/theatres/:id/screens` - Get theatre screens
- `GET /admin/screens/:id` - Get screen configuration
- `POST /admin/screens` - Create new screen
- `PUT /admin/screens/:id` - Update screen configuration
- `DELETE /admin/screens/:id` - Delete screen

## Usage Examples

### Basic Theatre Management
```typescript
// Add new theatre
addTheatre(): void {
  this.showTheatreForm.set(true);
  this.theatreForm.reset({
    name: '',
    location: '',
    address: '',
    totalScreens: 1,
    isActive: true
  });
}

// Toggle theatre status
toggleTheatreStatus(id: string, currentStatus: boolean): void {
  const endpoint = currentStatus ? 'pause' : 'resume';
  this.http.put(`${environment.apiUrl}/admin/theatres/${id}/${endpoint}`, {})
    .subscribe(/* handle response */);
}
```

### Screen Configuration
```typescript
// Open screen configuration
openScreenConfig(theatreId: string, screenId: string): void {
  this.configTheatreId.set(theatreId);
  this.configScreenId.set(screenId);
  this.router.navigate(['/admin/venues', theatreId, screenId]);
}

// Quick assign categories to rows
applyQuickAssign(): void {
  const categoryId = this.quickAssignCategory();
  const fromRow = this.quickAssignFromRow();
  const toRow = this.quickAssignToRow();
  
  this.seatMap.update(seats => seats.map(s => 
    (s.row >= fromRow && s.row <= toRow) 
      ? { ...s, categoryId, status: 'available' } 
      : s
  ));
}
```

## Styling Features

### Modern Design System
- **CSS Custom Properties** for consistent theming
- **Gradient backgrounds** for visual appeal
- **Box shadows** with multiple layers for depth
- **Smooth animations** using CSS transitions
- **Responsive grid layouts** with CSS Grid and Flexbox

### Animation Examples
```scss
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.venue-wrapper {
  animation: fadeIn 0.6s ease-out;
}

.theatre-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-shadow-hover);
  }
}
```

## Accessibility Features

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** for modals and forms
- **Color contrast** compliance
- **Semantic HTML** structure

## Performance Optimizations

- **OnPush change detection** with signals
- **Lazy loading** of screen configurations
- **Efficient tracking** functions for *ngFor loops
- **Debounced search** to reduce API calls
- **Memoized computed values** with signals

## Migration Guide

### From Old Components
1. Update navigation links to use `/admin/venues`
2. Replace direct component imports with new venue management
3. Update any hardcoded routes in services
4. Test all existing functionality in the new interface

### Breaking Changes
- Old component selectors are no longer available
- Some method signatures may have changed
- CSS classes have been updated for the new design system

## Future Enhancements

- **Bulk operations** for multiple theatres
- **Import/Export** functionality for configurations
- **Template system** for common screen layouts
- **Advanced analytics** for venue performance
- **Integration** with booking system for real-time seat status