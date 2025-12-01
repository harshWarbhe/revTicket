package com.revticket.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "seat_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatData {
    @Id
    private String seatId;

    @Column(nullable = false)
    private String label;

    @Column(name = "row_num", nullable = false)
    private Integer row;

    @Column(nullable = false)
    private Integer col;

    @Column(name = "category_id")
    private String categoryId;

    @Column(nullable = false)
    private String status; // available, booked, disabled

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;
}
