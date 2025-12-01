package com.revticket.dto;

import lombok.Builder;
import lombok.Value;
import java.util.List;

@Value
@Builder
public class TheaterResponse {
    String id;
    String name;
    String location;
    String address;
    Integer totalScreens;
    String imageUrl;
    Boolean isActive;
    List<CategoryDTO> defaultCategories;
}


