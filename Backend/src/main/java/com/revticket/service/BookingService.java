package com.revticket.service;

import com.revticket.dto.BookingRequest;
import com.revticket.dto.BookingResponse;
import com.revticket.entity.Booking;
import com.revticket.entity.Movie;
import com.revticket.entity.Seat;
import com.revticket.entity.Showtime;
import com.revticket.entity.Theater;
import com.revticket.entity.User;
import com.revticket.repository.BookingRepository;
import com.revticket.repository.SeatRepository;
import com.revticket.repository.ShowtimeRepository;
import com.revticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Transactional
    public BookingResponse createBooking(String userId, BookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        for (String seatId : request.getSeats()) {
            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatId));

            if (seat.getIsBooked()) {
                throw new RuntimeException("Seat " + seatId + " is already booked");
            }
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setSeats(request.getSeats());
        booking.setTotalAmount(request.getTotalAmount());
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerEmail(request.getCustomerEmail());
        booking.setCustomerPhone(request.getCustomerPhone());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setTicketNumber("TKT" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setQrCode("QR_" + UUID.randomUUID().toString());

        booking = bookingRepository.save(booking);

        for (String seatId : request.getSeats()) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            if (seat != null) {
                seat.setIsBooked(true);
                seatRepository.save(seat);
            }
        }

        showtime.setAvailableSeats(showtime.getAvailableSeats() - request.getSeats().size());
        showtimeRepository.save(showtime);

        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<BookingResponse> getBookingById(String id) {
        return bookingRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional
    public BookingResponse cancelBooking(String id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);

        for (String seatId : booking.getSeats()) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            if (seat != null) {
                seat.setIsBooked(false);
                seatRepository.save(seat);
            }
        }

        Showtime showtime = booking.getShowtime();
        showtime.setAvailableSeats(showtime.getAvailableSeats() + booking.getSeats().size());
        showtimeRepository.save(showtime);

        booking.setRefundAmount(calculateRefund(booking));
        booking.setRefundDate(LocalDateTime.now());

        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Double calculateRefund(Booking booking) {
        return booking.getTotalAmount() * 0.9;
    }

    private BookingResponse mapToResponse(Booking booking) {
        Showtime showtime = booking.getShowtime();
        Movie movie = showtime.getMovie();
        Theater theater = showtime.getTheater();

        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .movieId(movie != null ? movie.getId() : null)
                .movieTitle(movie != null ? movie.getTitle() : null)
                .moviePosterUrl(movie != null ? movie.getPosterUrl() : null)
                .theaterId(theater != null ? theater.getId() : null)
                .theaterName(theater != null ? theater.getName() : null)
                .theaterLocation(theater != null ? theater.getLocation() : null)
                .showtimeId(showtime.getId())
                .showtime(showtime.getShowDateTime())
                .screen(showtime.getScreen())
                .ticketPrice(showtime.getTicketPrice())
                .seats(booking.getSeats())
                .totalAmount(booking.getTotalAmount())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .customerName(booking.getCustomerName())
                .customerEmail(booking.getCustomerEmail())
                .customerPhone(booking.getCustomerPhone())
                .paymentId(booking.getPaymentId())
                .qrCode(booking.getQrCode())
                .ticketNumber(booking.getTicketNumber())
                .refundAmount(booking.getRefundAmount())
                .refundDate(booking.getRefundDate())
                .cancellationReason(booking.getCancellationReason())
                .build();
    }
}

