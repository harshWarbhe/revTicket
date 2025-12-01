package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScreenConfigDTO {
    private String id;
    private String name;
    private String theatreId;
    private Integer rows;
    private Integer seatsPerRow;
    private Integer totalSeats;
    private List<CategoryDTO> categories;
    private List<SeatDataDTO> seatMap;
}
