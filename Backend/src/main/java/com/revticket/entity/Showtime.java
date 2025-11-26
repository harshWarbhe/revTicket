package com.revticket.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "showtimes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Showtime {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    @JsonBackReference
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theater_id", nullable = false)
    @JsonBackReference("theater-showtimes")
    private Theater theater;

    @Column(nullable = false)
    private String screen;

    @Column(name = "show_date_time", nullable = false)
    private LocalDateTime showDateTime;

    @Column(name = "ticket_price", nullable = false)
    private Double ticketPrice;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @Column(name = "available_seats", nullable = false)
    private Integer availableSeats;

    @Enumerated(EnumType.STRING)
    private ShowStatus status = ShowStatus.ACTIVE;

    @OneToMany(mappedBy = "showtime", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("showtime-seats")
    private List<Seat> seats = new ArrayList<>();

    @OneToMany(mappedBy = "showtime", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("showtime-bookings")
    private List<Booking> bookings = new ArrayList<>();

    public enum ShowStatus {
        ACTIVE, COMPLETED, CANCELLED
    }
}

