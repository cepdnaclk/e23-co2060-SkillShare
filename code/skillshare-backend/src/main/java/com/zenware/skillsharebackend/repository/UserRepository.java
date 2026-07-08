package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
    @Query("SELECT u FROM User u ORDER BY u.reputationScore DESC LIMIT :limit")
    List<User> findTopMentorsByReputation(@Param("limit") int limit);

    // Fetch the most active users sorted by XP and Level
    @Query("SELECT u FROM User u ORDER BY u.level DESC, u.xp DESC LIMIT :limit")
    List<User> findTopUsersByXp(@Param("limit") int limit);

    // Fetch top mentors for a specific skill, ordered by reputation
    @Query("SELECT u FROM User u WHERE u.id IN " +
            "(SELECT s.mentor.id FROM Session s WHERE LOWER(s.skill.name) = LOWER(:category) AND s.status = 'COMPLETED') " +
            "ORDER BY u.reputationScore DESC LIMIT :limit")
    List<User> findTopMentorsByCategory(@Param("category") String category, @Param("limit") int limit);
}