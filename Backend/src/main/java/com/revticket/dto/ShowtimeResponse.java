package com.revticket.dto;

import com.revticket.entity.Showtime;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class ShowtimeResponse {
    String id;
    String movieId;
    String theaterId;
    String screen;
    LocalDateTime showDateTime;
    Double ticketPrice;
    Integer totalSeats;
    Integer availableSeats;
    Showtime.ShowStatus status;
    MovieSummary movie;
    TheaterSummary theater;

    @Value
    @Builder
    public static class MovieSummary {
        String id;
        String title;
        List<String> genre;
        Integer duration;
        Double rating;
        String posterUrl;
    }

    @Value
    @Builder
    public static class TheaterSummary {
        String id;
        String name;
        String location;
        String address;
        Integer totalScreens;
    }
}


