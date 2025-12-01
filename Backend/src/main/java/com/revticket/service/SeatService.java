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
import java.util.Objects;

@Service
public class SeatService {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private com.revticket.repository.SeatDataRepository seatDataRepository;

    @Autowired
    private com.revticket.repository.SeatCategoryRepository seatCategoryRepository;

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

        Showtime showtime = showtimeRepository.findById(Objects.requireNonNullElse(showtimeId, ""))
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        String screenId = showtime.getScreen();
        
        // Load seat configuration from screen
        List<com.revticket.entity.SeatData> seatDataList = seatDataRepository.findByScreenId(screenId);
        List<com.revticket.entity.SeatCategory> categories = seatCategoryRepository.findByScreenId(screenId);
        
        if (seatDataList.isEmpty() || categories.isEmpty()) {
            // Fallback: use screen's basic layout info
            initializeSeatsFromScreenLayout(showtime, screenId);
            return;
        }
        
        // Create a map of category ID to price
        java.util.Map<String, Double> categoryPriceMap = new java.util.HashMap<>();
        for (com.revticket.entity.SeatCategory category : categories) {
            categoryPriceMap.put(category.getId(), category.getPrice());
        }
        
        List<Seat> seatsToSave = new ArrayList<>();
        int enabledSeats = 0;
        
        for (com.revticket.entity.SeatData seatData : seatDataList) {
            if ("disabled".equals(seatData.getStatus())) {
                continue; // Skip disabled seats
            }
            
            Seat seat = new Seat();
            seat.setShowtime(showtime);
            seat.setRow(getRowLabel(seatData.getRow()));
            seat.setNumber(seatData.getCol() + 1);
            seat.setIsBooked(false);
            seat.setIsHeld(false);
            
            // Get price from category
            Double price = categoryPriceMap.get(seatData.getCategoryId());
            seat.setPrice(price != null ? price : 100.0);
            
            // Determine seat type based on price
            if (price != null) {
                if (price >= 250) {
                    seat.setType(Seat.SeatType.VIP);
                } else if (price >= 150) {
                    seat.setType(Seat.SeatType.PREMIUM);
                } else {
                    seat.setType(Seat.SeatType.REGULAR);
                }
            } else {
                seat.setType(Seat.SeatType.REGULAR);
            }
            
            seatsToSave.add(seat);
            enabledSeats++;
        }
        
        seatRepository.saveAll(seatsToSave);
        showtime.setTotalSeats(enabledSeats);
        showtime.setAvailableSeats(enabledSeats);
        showtimeRepository.save(showtime);
    }
    
    private String getRowLabel(int rowIndex) {
        return String.valueOf((char) ('A' + rowIndex));
    }
    
    @Autowired
    private com.revticket.repository.ScreenRepository screenRepository;
    
    private void initializeSeatsFromScreenLayout(Showtime showtime, String screenId) {
        com.revticket.entity.Screen screen = screenRepository.findById(screenId).orElse(null);
        
        if (screen == null || screen.getRows() == null || screen.getSeatsPerRow() == null) {
            initializeDefaultSeats(showtime);
            return;
        }
        
        int rows = screen.getRows();
        int seatsPerRow = screen.getSeatsPerRow();
        List<Seat> seatsToSave = new ArrayList<>();

        for (int r = 0; r < rows; r++) {
            String rowLabel = getRowLabel(r);
            for (int i = 1; i <= seatsPerRow; i++) {
                Seat seat = new Seat();
                seat.setShowtime(showtime);
                seat.setRow(rowLabel);
                seat.setNumber(i);
                seat.setIsBooked(false);
                seat.setIsHeld(false);

                // Simple pricing based on row position
                if (r < rows / 3) {
                    seat.setPrice(150.0);
                    seat.setType(Seat.SeatType.REGULAR);
                } else if (r < (rows * 2) / 3) {
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
    
    private void initializeDefaultSeats(Showtime showtime) {
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

        Showtime showtime = showtimeRepository.findById(Objects.requireNonNullElse(showtimeId, ""))
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
            String safeSeatId = Objects.requireNonNullElse(seatId, "");
            Seat seat = seatRepository.findById(safeSeatId)
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
            String safeSeatId = Objects.requireNonNullElse(seatId, "");
            Seat seat = seatRepository.findById(safeSeatId).orElse(null);
            if (seat != null && !seat.getIsBooked()) {
                seat.setIsHeld(false);
                seat.setHoldExpiry(null);
                seat.setSessionId(null);
                seatRepository.save(seat);
            }
        }
    }
}
