package com.revticket.service;

import com.revticket.dto.MovieDTO;
import com.revticket.dto.MovieRequest;
import com.revticket.entity.Movie;
import com.revticket.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    public List<Movie> getAllMovies() {
        return movieRepository.findByIsActiveTrue();
    }

    public List<Movie> getMoviesByCity(String city) {
        if (city == null || city.trim().isEmpty()) {
            return movieRepository.findByIsActiveTrue();
        }
        return movieRepository.findActiveMoviesByCity(city);
    }

    public List<MovieDTO> getAllMoviesForAdmin() {
        return movieRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MovieDTO> getActiveMovies() {
        return movieRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<MovieDTO> getMovieById(String id) {
        return movieRepository.findById(Objects.requireNonNullElse(id, ""))
                .map(this::convertToDTO);
    }

    public MovieDTO createMovie(MovieRequest request) {
        Movie movie = new Movie();
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(request.getGenre());
        movie.setDuration(request.getDuration());
        movie.setRating(request.getRating());
        movie.setDirector(request.getDirector());
        movie.setCrew(request.getCrew());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setLanguage(request.getLanguage());
        movie.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        Movie saved = movieRepository.save(movie);
        return convertToDTO(saved);
    }

    public MovieDTO updateMovie(String id, MovieRequest request) {
        Movie movie = movieRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(request.getGenre());
        movie.setDuration(request.getDuration());
        movie.setRating(request.getRating());
        movie.setDirector(request.getDirector());
        movie.setCrew(request.getCrew());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setLanguage(request.getLanguage());
        if (request.getIsActive() != null) {
            movie.setIsActive(request.getIsActive());
        }

        Movie saved = movieRepository.save(movie);
        return convertToDTO(saved);
    }

    public MovieDTO toggleMovieStatus(String id) {
        Movie movie = movieRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        movie.setIsActive(!movie.getIsActive());
        Movie saved = movieRepository.save(movie);
        return convertToDTO(saved);
    }

    public void deleteMovie(String id) {
        Movie movie = movieRepository.findById(Objects.requireNonNullElse(id, ""))
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        movie.setIsActive(false);
        movieRepository.save(movie);
    }

    public List<String> getAllGenres() {
        return movieRepository.findAll().stream()
                .flatMap(movie -> movie.getGenre().stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<Double> getAllRatings() {
        return movieRepository.findAll().stream()
                .map(Movie::getRating)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private MovieDTO convertToDTO(Movie movie) {
        MovieDTO dto = new MovieDTO();
        dto.setId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setDescription(movie.getDescription());
        dto.setGenre(movie.getGenre());
        dto.setDuration(movie.getDuration());
        dto.setRating(movie.getRating());
        dto.setDirector(movie.getDirector());
        dto.setCrew(movie.getCrew());
        dto.setReleaseDate(movie.getReleaseDate());
        dto.setPosterUrl(movie.getPosterUrl());
        dto.setTrailerUrl(movie.getTrailerUrl());
        dto.setLanguage(movie.getLanguage());
        dto.setIsActive(movie.getIsActive());
        dto.setTotalShows(movieRepository.countShowtimesByMovieId(movie.getId()));
        dto.setTotalBookings(movieRepository.countBookingsByMovieId(movie.getId()));
        return dto;
    }
}

