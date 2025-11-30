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
import java.util.Objects;
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

    @Autowired
    private com.revticket.repository.ScreenRepository screenRepository;

    @Transactional
    public BookingResponse createBooking(String userId, BookingRequest request) {

        User user = userRepository.findById(Objects.requireNonNullElse(userId, ""))
                .orElseThrow(() -> new RuntimeException("User not found"));

        Showtime showtime = showtimeRepository.findById(Objects.requireNonNullElse(request.getShowtimeId(), ""))
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        for (String seatId : request.getSeats()) {
            String safeSeatId = Objects.requireNonNullElse(seatId, "");
            Seat seat = seatRepository.findById(safeSeatId)
                    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatId));

            if (seat.getIsBooked()) {
                throw new RuntimeException("Seat " + seatId + " is already booked");
            }
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShowtime(showtime);
        booking.setSeats(request.getSeats());
        if (request.getSeatLabels() != null && !request.getSeatLabels().isEmpty()) {
            booking.setSeatLabels(request.getSeatLabels());
        }
        booking.setTotalAmount(request.getTotalAmount());
        booking.setTicketPriceSnapshot(showtime.getTicketPrice());
        booking.setScreenName(showtime.getScreen());
        booking.setPaymentMethod("ONLINE");
        booking.setCustomerName(Objects.requireNonNullElse(request.getCustomerName(), ""));
        booking.setCustomerEmail(Objects.requireNonNullElse(request.getCustomerEmail(), ""));
        booking.setCustomerPhone(Objects.requireNonNullElse(request.getCustomerPhone(), ""));
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setTicketNumber("TKT" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setQrCode("QR_" + UUID.randomUUID().toString());

        booking = bookingRepository.save(booking);

        for (String seatId : request.getSeats()) {
            String safeSeatId = Objects.requireNonNullElse(seatId, "");
            Seat seat = seatRepository.findById(safeSeatId).orElse(null);
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
        return bookingRepository.findByUserId(Objects.requireNonNullElse(userId, ""))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<BookingResponse> getBookingById(String id) {
        return bookingRepository.findById(Objects.requireNonNullElse(id, ""))
                .map(this::mapToResponse);
    }

    @Transactional
    public BookingResponse requestCancellation(String id, String reason) {
        Booking booking = bookingRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new RuntimeException("Only confirmed bookings can request cancellation");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLATION_REQUESTED);
        booking.setCancellationReason(Objects.requireNonNullElse(reason, ""));

        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getCancellationRequests() {
        return bookingRepository.findAll()
                .stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CANCELLATION_REQUESTED)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse cancelBooking(String id, String reason) {

        Booking booking = bookingRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        if (reason != null && !reason.isEmpty()) {
            booking.setCancellationReason(Objects.requireNonNullElse(reason, ""));
        }

        for (String seatId : booking.getSeats()) {
            String safeSeatId = Objects.requireNonNullElse(seatId, "");
            Seat seat = seatRepository.findById(safeSeatId).orElse(null);
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
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Double calculateRefund(Booking booking) {
        return booking.getTotalAmount() * 0.9;
    }

    @Transactional
    public void deleteBooking(String id) {
        Booking booking = bookingRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        for (String seatId : booking.getSeats()) {
            Seat seat = seatRepository.findById(Objects.requireNonNullElse(seatId, "")).orElse(null);
            if (seat != null) {
                seat.setIsBooked(false);
                seatRepository.save(seat);
            }
        }

        Showtime showtime = booking.getShowtime();
        showtime.setAvailableSeats(showtime.getAvailableSeats() + booking.getSeats().size());
        showtimeRepository.save(showtime);

        bookingRepository.delete(booking);
    }

    @Transactional
    public BookingResponse scanBooking(String id) {
        Booking booking = bookingRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot scan cancelled booking");
        }

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse resignBooking(String id, List<String> newSeats) {
        Booking booking = bookingRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot reassign seats for cancelled booking");
        }

        for (String seatId : booking.getSeats()) {
            Seat seat = seatRepository.findById(Objects.requireNonNullElse(seatId, "")).orElse(null);
            if (seat != null) {
                seat.setIsBooked(false);
                seatRepository.save(seat);
            }
        }

        for (String seatId : newSeats) {
            Seat seat = seatRepository.findById(Objects.requireNonNullElse(seatId, ""))
                    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatId));
            if (seat.getIsBooked()) {
                throw new RuntimeException("Seat " + seatId + " is already booked");
            }
        }

        Showtime showtime = booking.getShowtime();
        int seatDifference = newSeats.size() - booking.getSeats().size();
        showtime.setAvailableSeats(showtime.getAvailableSeats() - seatDifference);
        showtimeRepository.save(showtime);

        booking.setSeats(newSeats);
        for (String seatId : newSeats) {
            Seat seat = seatRepository.findById(Objects.requireNonNullElse(seatId, "")).orElse(null);
            if (seat != null) {
                seat.setIsBooked(true);
                seatRepository.save(seat);
            }
        }

        return mapToResponse(bookingRepository.save(booking));
    }

    private String getScreenName(String screenId) {
        if (screenId == null || screenId.isEmpty()) {
            return "Screen";
        }
        return screenRepository.findById(screenId)
                .map(screen -> screen.getName())
                .orElse(screenId);
    }

    private BookingResponse mapToResponse(Booking booking) {

        Showtime showtime = booking.getShowtime();
        Movie movie = showtime.getMovie();
        Theater theater = showtime.getTheater();

        return BookingResponse.builder()
                .id(Objects.requireNonNullElse(booking.getId(), ""))
                .userId(Objects.requireNonNullElse(booking.getUser().getId(), ""))
                .movieId(movie != null ? Objects.requireNonNullElse(movie.getId(), "") : "")
                .movieTitle(movie != null ? Objects.requireNonNullElse(movie.getTitle(), "") : "")
                .moviePosterUrl(movie != null ? Objects.requireNonNullElse(movie.getPosterUrl(), "") : "")
                .theaterId(theater != null ? Objects.requireNonNullElse(theater.getId(), "") : "")
                .theaterName(theater != null ? Objects.requireNonNullElse(theater.getName(), "") : "")
                .theaterLocation(theater != null ? Objects.requireNonNullElse(theater.getLocation(), "") : "")
                .showtimeId(Objects.requireNonNullElse(showtime.getId(), ""))
                .showtime(showtime.getShowDateTime())
                .screen(getScreenName(showtime.getScreen()))
                .ticketPrice(showtime.getTicketPrice())
                .seats(booking.getSeats())
                .seatLabels(booking.getSeatLabels())
                .totalAmount(booking.getTotalAmount())
                .bookingDate(booking.getBookingDate())
                .status(booking.getStatus())
                .customerName(Objects.requireNonNullElse(booking.getCustomerName(), ""))
                .customerEmail(Objects.requireNonNullElse(booking.getCustomerEmail(), ""))
                .customerPhone(Objects.requireNonNullElse(booking.getCustomerPhone(), ""))
                .paymentId(Objects.requireNonNullElse(booking.getPaymentId(), ""))
                .qrCode(Objects.requireNonNullElse(booking.getQrCode(), ""))
                .ticketNumber(Objects.requireNonNullElse(booking.getTicketNumber(), ""))
                .refundAmount(booking.getRefundAmount())
                .refundDate(booking.getRefundDate())
                .cancellationReason(Objects.requireNonNullElse(booking.getCancellationReason(), ""))
                .build();
    }
}