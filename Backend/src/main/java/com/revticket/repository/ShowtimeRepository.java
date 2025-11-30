package com.revticket.repository;

import com.revticket.entity.Showtime;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, String> {

    @EntityGraph(attributePaths = {"movie", "theater"})
    List<Showtime> findAllByOrderByShowDateTimeAsc();

    @EntityGraph(attributePaths = {"movie", "theater"})
    List<Showtime> findByMovieId(String movieId);

    @EntityGraph(attributePaths = {"movie", "theater"})
    List<Showtime> findByTheaterId(String theaterId);

    @EntityGraph(attributePaths = {"movie", "theater"})
    @Query("SELECT s FROM Showtime s WHERE s.movie.id = :movieId AND s.showDateTime BETWEEN :start AND :end")
    List<Showtime> findByMovieIdAndShowDateBetween(@Param("movieId") String movieId,
                                                   @Param("start") LocalDateTime start,
                                                   @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"movie", "theater"})
    @Query("SELECT s FROM Showtime s WHERE s.id = :id")
    Optional<Showtime> findWithRelationsById(@Param("id") String id);

    @Query("SELECT s FROM Showtime s WHERE s.screen = :screen AND s.showDateTime BETWEEN :start AND :end")
    List<Showtime> findByScreenAndShowDateTimeBetween(@Param("screen") String screen,
                                                       @Param("start") LocalDateTime start,
                                                       @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"movie", "theater"})
    @Query("SELECT s FROM Showtime s WHERE s.theater.id = :theaterId AND s.showDateTime BETWEEN :start AND :end")
    List<Showtime> findByTheaterIdAndShowDateBetween(@Param("theaterId") String theaterId,
                                                      @Param("start") LocalDateTime start,
                                                      @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"movie", "theater"})
    @Query("SELECT s FROM Showtime s WHERE s.showDateTime BETWEEN :start AND :end ORDER BY s.showDateTime ASC")
    List<Showtime> findByShowDateTimeBetween(@Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);
}

