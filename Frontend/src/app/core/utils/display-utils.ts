export class DisplayUtils {
  
  static getScreenLabel(screenId: string, screenName?: string): string {
    if (screenName) return screenName;
    // Convert UUID to Screen number (use last 2 digits of UUID)
    const num = parseInt(screenId.slice(-2), 16) % 10 + 1;
    return `Screen ${num}`;
  }
  
  static getShowLabel(showtimeId: string): string {
    // Convert UUID to Show number (use last 3 digits of UUID)
    const num = parseInt(showtimeId.slice(-3), 16) % 900 + 100;
    return `Show #${num}`;
  }
  
  static getSeatLabel(seatId: string, row?: string, number?: number): string {
    if (row && number) return `${row}${number}`;
    // Fallback: convert UUID to seat label
    const rowNum = parseInt(seatId.slice(-4, -2), 16) % 8;
    const seatNum = parseInt(seatId.slice(-2), 16) % 12 + 1;
    const rowLetter = String.fromCharCode(65 + rowNum); // A-H
    return `${rowLetter}${seatNum}`;
  }
  
  static getBookingLabel(bookingId: string): string {
    // Convert UUID to booking number
    const num = parseInt(bookingId.slice(-4), 16) % 9000 + 1000;
    return `#${num}`;
  }
  
  static getTheaterLabel(theaterId: string, theaterName?: string): string {
    if (theaterName) return theaterName;
    // Fallback theater name
    const num = parseInt(theaterId.slice(-2), 16) % 10 + 1;
    return `Theater ${num}`;
  }
}