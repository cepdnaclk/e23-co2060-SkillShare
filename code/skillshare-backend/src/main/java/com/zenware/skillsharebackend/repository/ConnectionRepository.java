package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    // 1. Guardrail: Check if ANY connection exists between two users to prevent duplicate requests
    @Query("SELECT c FROM Connection c WHERE " +
            "(c.sender.id = :userId1 AND c.receiver.id = :userId2) OR " +
            "(c.sender.id = :userId2 AND c.receiver.id = :userId1)")
    Optional<Connection> findExistingConnection(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    // 2. Fetch all pending requests sent TO a specific user (for their notification bell)
    List<Connection> findByReceiverIdAndStatus(UUID receiverId, ConnectionStatus status);

    // 3. Fetch all active friends (ACCEPTED status) for a specific user
    @Query("SELECT c FROM Connection c WHERE " +
            "(c.sender.id = :userId OR c.receiver.id = :userId) AND c.status = 'ACCEPTED'")
    List<Connection> findAllAcceptedConnectionsForUser(@Param("userId") UUID userId);
}