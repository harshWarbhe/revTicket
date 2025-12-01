package com.revticket.repository;

import com.revticket.entity.SeatCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatCategoryRepository extends JpaRepository<SeatCategory, String> {
    List<SeatCategory> findByScreenId(String screenId);
    void deleteByScreenId(String screenId);
}
