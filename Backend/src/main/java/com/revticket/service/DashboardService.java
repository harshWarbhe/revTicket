package com.revticket.service;

import com.revticket.dto.DashboardStatsDTO;
import com.revticket.entity.Booking;
import com.revticket.repository.BookingRepository;
import com.revticket.repository.MovieRepository;
import com.revticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class DashboardService {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        Long totalMovies = movieRepository.count();
        Long totalBookings = bookingRepository.count();
        Long totalUsers = userRepository.count();

        Double totalRevenue = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                .mapToDouble(Booking::getTotalAmount)
                .sum();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        Long todayBookings = bookingRepository.countByDateRange(todayStart, todayEnd);

        Long cancelledBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CANCELLED)
                .count();

        Long activeMovies = movieRepository.findAll().stream()
                .filter(m -> m.getIsActive() != null && m.getIsActive())
                .count();

        return DashboardStatsDTO.builder()
                .totalMovies(totalMovies)
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .totalUsers(totalUsers)
                .todayBookings(todayBookings)
                .cancelledBookings(cancelledBookings)
                .activeMovies(activeMovies)
                .build();
    }
}
