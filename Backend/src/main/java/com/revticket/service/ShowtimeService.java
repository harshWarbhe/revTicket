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
import java.util.Objects;
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
    public List<ShowtimeResponse> getShowtimesByMovieAndCity(String movieId, String city) {
        return showtimeRepository.findByMovieIdAndCity(movieId, city)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesByMovieDateAndCity(String movieId, LocalDate date, String city) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return showtimeRepository.findByMovieIdCityAndShowDateBetween(movieId, city, start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getShowtimesWithFilters(String movieId, String theaterId, LocalDate date, String search) {
        List<Showtime> showtimes;
        
        if (date != null) {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            if (movieId != null) {
                showtimes = showtimeRepository.findByMovieIdAndShowDateBetween(movieId, start, end);
            } else if (theaterId != null) {
                showtimes = showtimeRepository.findByTheaterIdAndShowDateBetween(theaterId, start, end);
            } else {
                showtimes = showtimeRepository.findByShowDateTimeBetween(start, end);
            }
        } else if (movieId != null) {
            showtimes = showtimeRepository.findByMovieId(movieId);
        } else if (theaterId != null) {
            showtimes = showtimeRepository.findByTheaterId(theaterId);
        } else {
            showtimes = showtimeRepository.findAllByOrderByShowDateTimeAsc();
        }
        
        // Apply search filter
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase().trim();
            showtimes = showtimes.stream()
                .filter(s -> s.getMovie().getTitle().toLowerCase().contains(searchLower) ||
                            s.getTheater().getName().toLowerCase().contains(searchLower))
                .collect(Collectors.toList());
        }
        
        return showtimes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ShowtimeResponse> getShowtimeById(String id) {
        return showtimeRepository.findWithRelationsById(id).map(this::mapToResponse);
    }

    @Transactional
    public ShowtimeResponse createShowtime(ShowtimeRequest request) {
        Movie movie = movieRepository.findById(Objects.requireNonNullElse(request.getMovieId(), ""))
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theater theater = theaterRepository.findById(Objects.requireNonNullElse(request.getTheaterId(), ""))
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
        Showtime showtime = showtimeRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Showtime not found"));

        Movie movie = movieRepository.findById(Objects.requireNonNullElse(request.getMovieId(), ""))
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Theater theater = theaterRepository.findById(Objects.requireNonNullElse(request.getTheaterId(), ""))
                .orElseThrow(() -> new RuntimeException("Theater not found"));

        applyRequest(showtime, request, movie, theater, false);
        return mapToResponse(showtimeRepository.save(showtime));
    }

    @Transactional
    public void deleteShowtime(String id) {
        Showtime showtime = showtimeRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Showtime not found"));
        showtimeRepository.delete(showtime);
    }

    @Transactional
    public ShowtimeResponse toggleShowtimeStatus(String id) {
        Showtime showtime = showtimeRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Showtime not found"));
        
        // Toggle between ACTIVE and CANCELLED
        if (showtime.getStatus() == Showtime.ShowStatus.ACTIVE) {
            showtime.setStatus(Showtime.ShowStatus.CANCELLED);
        } else if (showtime.getStatus() == Showtime.ShowStatus.CANCELLED) {
            showtime.setStatus(Showtime.ShowStatus.ACTIVE);
        }
        
        return mapToResponse(showtimeRepository.save(showtime));
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
        
        if (request.getStatus() != null) {
            showtime.setStatus(request.getStatus());
        } else if (isCreate) {
            showtime.setStatus(Showtime.ShowStatus.ACTIVE);
        }
        // If updating and status not provided, keep existing status
    }

    public boolean checkShowtimeConflict(String screenId, LocalDateTime showDateTime, String excludeShowId) {
        // Check if there's any showtime on the same screen within 3 hours window
        LocalDateTime startWindow = showDateTime.minusHours(3);
        LocalDateTime endWindow = showDateTime.plusHours(3);
        
        List<Showtime> conflictingShows = showtimeRepository.findByScreenAndShowDateTimeBetween(
                screenId, startWindow, endWindow);
        
        if (excludeShowId != null) {
            conflictingShows = conflictingShows.stream()
                    .filter(show -> !show.getId().equals(excludeShowId))
                    .collect(Collectors.toList());
        }
        
        return !conflictingShows.isEmpty();
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
                        .rating(null)
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

