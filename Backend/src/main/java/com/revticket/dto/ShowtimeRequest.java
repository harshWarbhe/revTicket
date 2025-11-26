package com.revticket.dto;

import com.revticket.entity.Showtime;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ShowtimeRequest {

    @NotBlank
    private String movieId;

    @NotBlank
    private String theaterId;

    @NotBlank
    private String screen;

    @NotNull
    private LocalDateTime showDateTime;

    @NotNull
    @Positive
    private Double ticketPrice;

    @NotNull
    @Min(1)
    private Integer totalSeats;

    @Min(0)
    private Integer availableSeats;

    private Showtime.ShowStatus status = Showtime.ShowStatus.ACTIVE;

    private List<SeatLayoutRequest.SeatSection> seatLayout;
}


