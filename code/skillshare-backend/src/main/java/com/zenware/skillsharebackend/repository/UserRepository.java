package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Custom query to find a user by their email
    Optional<User> findByEmail(String email);

    // Fetch the top mentors sorted by reputation score (descending)
    // TIE-BREAKER ADDED: u.id ASC
    @Query("SELECT u FROM User u ORDER BY u.reputationScore DESC, u.id ASC")
    List<User> findTopMentorsByReputation(Pageable pageable);

    // Fetch the most active users sorted by XP and Level
    // TIE-BREAKER ADDED: u.id ASC
    @Query("SELECT u FROM User u ORDER BY u.level DESC, u.xp DESC, u.id ASC")
    List<User> findTopUsersByXp(Pageable pageable);

    // Fetch top mentors for a specific skill, ordered by reputation
    // TIE-BREAKER ADDED: u.id ASC
    @Query("SELECT u FROM User u WHERE u.id IN " +
            "(SELECT s.mentor.id FROM Session s WHERE LOWER(s.skill.name) = LOWER(:category) AND s.status = 'COMPLETED') " +
            "ORDER BY u.reputationScore DESC, u.id ASC")
    List<User> findTopMentorsByCategory(@Param("category") String category, Pageable pageable);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE User u SET u.xp = u.xp + :amount WHERE u.id = :userId")
    void addXpAtomically(@Param("userId") UUID userId, @Param("amount") int amount);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE User u SET u.credits = u.credits + :amount WHERE u.id = :userId")
    void addCreditsAtomically(@Param("userId") UUID userId, @Param("amount") int amount);
}