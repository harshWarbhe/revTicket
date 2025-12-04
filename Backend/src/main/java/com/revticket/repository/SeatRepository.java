package com.revticket.repository;

import com.revticket.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, String> {
    List<Seat> findByShowtimeId(String showtimeId);
    List<Seat> findByShowtimeIdAndIsBookedFalse(String showtimeId);
    void deleteByShowtimeId(String showtimeId);
}

