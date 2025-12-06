package com.revticket.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 255, message = "Title must be between 2 and 255 characters")
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;
    
    @NotEmpty(message = "At least one genre is required")
    private List<String> genre;
    
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer duration;
    
    private String director;
    private List<String> crew;
    
    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;
    
    private String posterUrl;
    private String trailerUrl;
    
    @NotBlank(message = "Language is required")
    private String language;
    
    private Boolean isActive;
}
