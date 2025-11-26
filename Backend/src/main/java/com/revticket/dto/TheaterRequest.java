package com.revticket.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TheaterRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String location;

    @NotBlank
    private String address;

    @NotNull
    @Min(1)
    private Integer totalScreens;

    private String imageUrl;

    private Boolean isActive = true;
}


