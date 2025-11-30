package com.revticket.service;

import com.revticket.dto.*;
import com.revticket.entity.Booking;
import com.revticket.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookingReportService {

    @Autowired
    private BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public BookingReportSummary getSummary(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime start = fromDate.atStartOfDay();
        LocalDateTime end = toDate.atTime(LocalTime.MAX);

        Long totalBookings = bookingRepository.countByDateRange(start, end);
        Double totalRevenue = bookingRepository.sumRevenueByDateRange(start, end);
        Long cancelledBookings = bookingRepository.countCancelledByDateRange(start, end);
        Double totalRefunds = bookingRepository.sumRefundsByDateRange(start, end);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        Long todayBookings = bookingRepository.countByDateRange(todayStart, todayEnd);

        Double avgTicketPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0.0;

        return BookingReportSummary.builder()
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .cancelledBookings(cancelledBookings)
                .totalRefunds(totalRefunds)
                .todayBookings(todayBookings)
                .avgTicketPrice(avgTicketPrice)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RevenueTrendDTO> getRevenueTrend(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime start = fromDate.atStartOfDay();
        LocalDateTime end = toDate.atTime(LocalTime.MAX);

        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate().isAfter(start) && b.getBookingDate().isBefore(end))
                .collect(Collectors.toList());

        Map<String, RevenueTrendDTO> trendMap = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (LocalDate date = fromDate; !date.isAfter(toDate); date = date.plusDays(1)) {
            trendMap.put(date.format(formatter), new RevenueTrendDTO(date.format(formatter), 0.0, 0L));
        }

        bookings.forEach(booking -> {
            String dateKey = booking.getBookingDate().toLocalDate().format(formatter);
            if (trendMap.containsKey(dateKey)) {
                RevenueTrendDTO trend = trendMap.get(dateKey);
                if (booking.getStatus() == Booking.BookingStatus.CONFIRMED) {
                    trend.setRevenue(trend.getRevenue() + booking.getTotalAmount());
                }
                trend.setBookings(trend.getBookings() + 1);
            }
        });

        return new ArrayList<>(trendMap.values());
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getFilteredBookings(BookingReportFilter filter) {
        LocalDateTime fromDate = filter.getFromDate() != null ? filter.getFromDate().atStartOfDay() : null;
        LocalDateTime toDate = filter.getToDate() != null ? filter.getToDate().atTime(LocalTime.MAX) : null;

        Booking.BookingStatus status = null;
        if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
            try {
                status = Booking.BookingStatus.valueOf(filter.getStatus());
            } catch (IllegalArgumentException e) {
                status = null;
            }
        }

        Pageable pageable = PageRequest.of(
                filter.getPage(),
                filter.getSize(),
                Sort.by(Sort.Direction.DESC, "bookingDate"));

        Page<Booking> bookings = bookingRepository.findByFilters(
                fromDate,
                toDate,
                filter.getTheaterId(),
                filter.getMovieId(),
                status,
                filter.getSearchTerm(),
                pageable);

        return bookings.map(this::mapToResponse);
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(Objects.requireNonNullElse(booking.getId(), ""))
                .userId(Objects.requireNonNullElse(booking.getUser().getId(), ""))
                .movieId(booking.getShowtime().getMovie() != null
                        ? Objects.requireNonNullElse(booking.getShowtime().getMovie().getId(), "")
                        : "")
                .movieTitle(booking.getShowtime().getMovie() != null
                        ? Objects.requireNonNullElse(booking.getShowtime().getMovie().getTitle(), "")
                        : "")
                .moviePosterUrl(booking.getShowtime().getMovie() != null
                        ? Objects.requireNonNullElse(booking.getShowtime().getMovie().getPosterUrl(), "")
                        : "")
                .theaterId(booking.getShowtime().getTheater() != null
                        ? Objects.requireNonNullElse(booking.getShowtime().getTheater().getId(), "")
                        : "")
                .theaterName(booking.getShowtime().getTheater() != null
                        ? Objects.requireNonNullElse(booking.getShowtime().getTheater().getName(), "")
                        : "")
                .theaterLocation(booking.getShowtime().getTheater() != null
                        ? Objects.requireNonNullElse(booking.getShowtime().getTheater().getLocation(), "")
                        : "")
                .showtimeId(Objects.requireNonNullElse(booking.getShowtime().getId(), ""))
                .showtime(booking.getShowtime().getShowDateTime())
                .screen(booking.getScreenName() != null ? booking.getScreenName()
                        : Objects.requireNonNullElse(booking.getShowtime().getScreen(), ""))
                .ticketPrice(booking.getTicketPriceSnapshot() != null ? booking.getTicketPriceSnapshot()
                        : booking.getShowtime().getTicketPrice())
                .seats(booking.getSeats())
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
