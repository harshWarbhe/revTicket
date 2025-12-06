package com.revticket.repository;

import com.revticket.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LanguageRepository extends JpaRepository<Language, String> {
    List<Language> findByIsActiveTrueOrderByNameAsc();
    Optional<Language> findByName(String name);
}
