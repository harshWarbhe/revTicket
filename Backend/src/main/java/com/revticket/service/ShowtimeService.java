package com.revticket.service;

import com.revticket.dto.ShowtimeRequest;
import com.revticket.dto.ShowtimeResponse;
import com.revticket.entity.Movie;
import com.revticket.entity.Showtime;
import com.revticket.entity.Theater;
import com.revticket.repository.MovieRepository;
import com.revticket.repository.ShowtimeRepository;
import com.revticket.repository.TheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ShowtimeService {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private SeatService seatService;

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getAllShowtimes() {
        return showtimeRepository.findAllByOrderByShowDateTimeAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesByMovie(String movieId) {
        return showtimeRepository.findByMovieId(movieId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesByTheater(String theaterId) {
        return showtimeRepository.findByTheaterId(theaterId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesByMovieAndDate(String movieId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return showtimeRepository.findByMovieIdAndShowDateBetween(movieId, start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ShowtimeResponse> getShowtimeById(String id) {
        return showtimeRepository.findWithRelationsById(id).map(this::mapToResponse);
    }

    @Transactional
    public ShowtimeResponse createShowtime(ShowtimeRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theater theater = theaterRepository.findById(request.getTheaterId())
                .orElseThrow(() -> new RuntimeException("Theater not found"));

        Showtime showtime = new Showtime();
        applyRequest(showtime, request, movie, theater, true);
        Showtime saved = showtimeRepository.save(showtime);
        
        if (request.getSeatLayout() != null && !request.getSeatLayout().isEmpty()) {
            seatService.initializeSeatsWithLayout(saved.getId(), request.getSeatLayout());
        } else {
            seatService.initializeSeatsForShowtime(saved.getId());
        }
        
        return mapToResponse(saved);
    }

    @Transactional
    public ShowtimeResponse updateShowtime(String id, ShowtimeRequest request) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theater theater = theaterRepository.findById(request.getTheaterId())
                .orElseThrow(() -> new RuntimeException("Theater not found"));

        applyRequest(showtime, request, movie, theater, false);
        return mapToResponse(showtimeRepository.save(showtime));
    }

    @Transactional
    public void deleteShowtime(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Showtime not found"));
        showtimeRepository.delete(showtime);
    }

    private void applyRequest(Showtime showtime,
                              ShowtimeRequest request,
                              Movie movie,
                              Theater theater,
                              boolean isCreate) {
        showtime.setMovie(movie);
        showtime.setTheater(theater);
        showtime.setScreen(request.getScreen());
        showtime.setShowDateTime(request.getShowDateTime());
        showtime.setTicketPrice(request.getTicketPrice());
        showtime.setTotalSeats(request.getTotalSeats());

        int availableSeats;
        if (request.getAvailableSeats() != null) {
            availableSeats = request.getAvailableSeats();
        } else {
            availableSeats = isCreate ? request.getTotalSeats() : showtime.getAvailableSeats();
        }

        if (availableSeats > request.getTotalSeats()) {
            throw new IllegalArgumentException("Available seats cannot exceed total seats");
        }

        showtime.setAvailableSeats(availableSeats);
        showtime.setStatus(
                request.getStatus() != null ? request.getStatus() : Showtime.ShowStatus.ACTIVE
        );
    }

    private ShowtimeResponse mapToResponse(Showtime showtime) {
        Movie movie = showtime.getMovie();
        Theater theater = showtime.getTheater();

        return ShowtimeResponse.builder()
                .id(showtime.getId())
                .movieId(movie.getId())
                .theaterId(theater.getId())
                .screen(showtime.getScreen())
                .showDateTime(showtime.getShowDateTime())
                .ticketPrice(showtime.getTicketPrice())
                .totalSeats(showtime.getTotalSeats())
                .availableSeats(showtime.getAvailableSeats())
                .status(showtime.getStatus())
                .movie(ShowtimeResponse.MovieSummary.builder()
                        .id(movie.getId())
                        .title(movie.getTitle())
                        .genre(movie.getGenre())
                        .duration(movie.getDuration())
                        .rating(movie.getRating())
                        .posterUrl(movie.getPosterUrl())
                        .build())
                .theater(ShowtimeResponse.TheaterSummary.builder()
                        .id(theater.getId())
                        .name(theater.getName())
                        .location(theater.getLocation())
                        .address(theater.getAddress())
                        .totalScreens(theater.getTotalScreens())
                        .build())
                .build();
    }
}

