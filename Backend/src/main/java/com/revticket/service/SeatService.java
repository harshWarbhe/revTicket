package com.revticket.service;

import com.revticket.entity.Seat;
import com.revticket.entity.Showtime;
import com.revticket.repository.SeatRepository;
import com.revticket.repository.ShowtimeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SeatService {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Transactional
    public List<Seat> getSeatsByShowtime(String showtimeId) {
        List<Seat> seats = seatRepository.findByShowtimeId(showtimeId);
        if (seats.isEmpty()) {
            initializeSeatsForShowtime(showtimeId);
            seats = seatRepository.findByShowtimeId(showtimeId);
        }

        LocalDateTime now = LocalDateTime.now();
        List<Seat> expiredHolds = new ArrayList<>();
        for (Seat seat : seats) {
            if (Boolean.TRUE.equals(seat.getIsHeld()) &&
                seat.getHoldExpiry() != null &&
                seat.getHoldExpiry().isBefore(now)) {
                seat.setIsHeld(false);
                seat.setHoldExpiry(null);
                seat.setSessionId(null);
                expiredHolds.add(seat);
            }
        }

        if (!expiredHolds.isEmpty()) {
            seatRepository.saveAll(expiredHolds);
        }

        return seats;
    }

    @Transactional
    public void initializeSeatsForShowtime(String showtimeId) {
        if (!seatRepository.findByShowtimeId(showtimeId).isEmpty()) {
            return;
        }

        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        String[] rows = { "A", "B", "C", "D", "E", "F", "G", "H" };
        List<Seat> seatsToSave = new ArrayList<>();

        for (String row : rows) {
            for (int i = 1; i <= 12; i++) {
                Seat seat = new Seat();
                seat.setShowtime(showtime);
                seat.setRow(row);
                seat.setNumber(i);
                seat.setIsBooked(false);
                seat.setIsHeld(false);

                if ("A".equals(row) || "B".equals(row)) {
                    seat.setPrice(150.0);
                    seat.setType(Seat.SeatType.REGULAR);
                } else if ("C".equals(row) || "D".equals(row) || "E".equals(row)) {
                    seat.setPrice(200.0);
                    seat.setType(Seat.SeatType.PREMIUM);
                } else {
                    seat.setPrice(300.0);
                    seat.setType(Seat.SeatType.VIP);
                }
                seatsToSave.add(seat);
            }
        }

        seatRepository.saveAll(seatsToSave);
        int totalSeats = seatsToSave.size();
        showtime.setTotalSeats(totalSeats);
        showtime.setAvailableSeats(totalSeats);
        showtimeRepository.save(showtime);
    }

    @Transactional
    public void initializeSeatsWithLayout(String showtimeId, List<com.revticket.dto.SeatLayoutRequest.SeatSection> sections) {
        if (!seatRepository.findByShowtimeId(showtimeId).isEmpty()) {
            return;
        }

        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        List<Seat> seatsToSave = new ArrayList<>();

        for (com.revticket.dto.SeatLayoutRequest.SeatSection section : sections) {
            char startRow = section.getRowStart().charAt(0);
            char endRow = section.getRowEnd().charAt(0);
            
            for (char row = startRow; row <= endRow; row++) {
                for (int i = 1; i <= section.getSeatsPerRow(); i++) {
                    Seat seat = new Seat();
                    seat.setShowtime(showtime);
                    seat.setRow(String.valueOf(row));
                    seat.setNumber(i);
                    seat.setIsBooked(false);
                    seat.setIsHeld(false);
                    seat.setPrice(section.getPrice());
                    seat.setType(Seat.SeatType.valueOf(section.getType()));
                    seatsToSave.add(seat);
                }
            }
        }

        seatRepository.saveAll(seatsToSave);
        int totalSeats = seatsToSave.size();
        showtime.setTotalSeats(totalSeats);
        showtime.setAvailableSeats(totalSeats);
        showtimeRepository.save(showtime);
    }

    @Transactional
    public void holdSeats(String showtimeId, List<String> seatIds, String sessionId) {
        for (String seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatId));

            if (seat.getIsBooked()) {
                throw new RuntimeException("Seat " + seatId + " is already booked");
            }

            seat.setIsHeld(true);
            seat.setHoldExpiry(LocalDateTime.now().plusMinutes(10));
            seat.setSessionId(sessionId);
            seatRepository.save(seat);
        }
    }

    @Transactional
    public void releaseSeats(String showtimeId, List<String> seatIds) {
        for (String seatId : seatIds) {
            Seat seat = seatRepository.findById(seatId).orElse(null);
            if (seat != null && !seat.getIsBooked()) {
                seat.setIsHeld(false);
                seat.setHoldExpiry(null);
                seat.setSessionId(null);
                seatRepository.save(seat);
            }
        }
    }
}
