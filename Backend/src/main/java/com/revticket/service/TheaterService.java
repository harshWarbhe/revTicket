package com.revticket.service;

import com.revticket.dto.TheaterRequest;
import com.revticket.dto.TheaterResponse;
import com.revticket.entity.Theater;
import com.revticket.repository.TheaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TheaterService {

    @Autowired
    private TheaterRepository theaterRepository;

    @Transactional(readOnly = true)
    public List<TheaterResponse> getAllTheaters(boolean activeOnly) {
        List<Theater> theaters = activeOnly
                ? theaterRepository.findByIsActiveTrue()
                : theaterRepository.findAll();
        return theaters.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TheaterResponse> getTheaterById(String id) {
        return theaterRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional
    public TheaterResponse createTheater(TheaterRequest request) {
        Theater theater = new Theater();
        applyRequest(theater, request);
        return mapToResponse(theaterRepository.save(theater));
    }

    @Transactional
    public TheaterResponse updateTheater(String id, TheaterRequest request) {
        Theater theater = theaterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Theater not found"));
        applyRequest(theater, request);
        return mapToResponse(theaterRepository.save(theater));
    }

    @Transactional
    public TheaterResponse updateTheaterStatus(String id, boolean isActive) {
        Theater theater = theaterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Theater not found"));
        theater.setIsActive(isActive);
        return mapToResponse(theaterRepository.save(theater));
    }

    @Transactional
    public void deleteTheater(String id) {
        Theater theater = theaterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Theater not found"));
        theaterRepository.delete(theater);
    }

    private void applyRequest(Theater theater, TheaterRequest request) {
        theater.setName(request.getName());
        theater.setLocation(request.getLocation());
        theater.setAddress(request.getAddress());
        theater.setTotalScreens(request.getTotalScreens());
        theater.setImageUrl(request.getImageUrl());
        if (request.getIsActive() != null) {
            theater.setIsActive(request.getIsActive());
        } else if (theater.getIsActive() == null) {
            theater.setIsActive(true);
        }
    }

    private TheaterResponse mapToResponse(Theater theater) {
        return TheaterResponse.builder()
                .id(theater.getId())
                .name(theater.getName())
                .location(theater.getLocation())
                .address(theater.getAddress())
                .totalScreens(theater.getTotalScreens())
                .imageUrl(theater.getImageUrl())
                .isActive(theater.getIsActive())
                .build();
    }
}

