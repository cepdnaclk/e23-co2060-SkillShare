package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Custom query to find a user by their email
    Optional<User> findByEmail(String email);
}