package com.revticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatDataDTO {
    private String seatId;
    private String label;
    private Integer row;
    private Integer col;
    private String categoryId;
    private String status;
}
