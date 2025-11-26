package com.revticket.dto;

import lombok.Data;
import java.util.List;

@Data
public class SeatLayoutRequest {
    private List<SeatSection> sections;

    @Data
    public static class SeatSection {
        private String name;
        private String rowStart;
        private String rowEnd;
        private Integer seatsPerRow;
        private Double price;
        private String type; // REGULAR, PREMIUM, VIP
    }
}
