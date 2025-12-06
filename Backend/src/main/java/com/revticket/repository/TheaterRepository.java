package com.revticket.repository;

import com.revticket.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TheaterRepository extends JpaRepository<Theater, String> {
    List<Theater> findByIsActiveTrue();
    List<Theater> findByLocationAndIsActiveTrue(String location);
    List<Theater> findByLocation(String location);
}

