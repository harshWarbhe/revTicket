package com.revticket.repository;

import com.revticket.entity.SeatData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatDataRepository extends JpaRepository<SeatData, String> {
    List<SeatData> findByScreenId(String screenId);
    void deleteByScreenId(String screenId);
}
