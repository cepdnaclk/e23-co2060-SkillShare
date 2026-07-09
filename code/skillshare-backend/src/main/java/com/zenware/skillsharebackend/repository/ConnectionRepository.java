package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Connection;
import com.zenware.skillsharebackend.entity.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    // Used by our State Machine (No JOIN FETCH needed here because we are only checking if the row exists)
    @Query("SELECT c FROM Connection c WHERE " +
            "(c.sender.id = :userId1 AND c.receiver.id = :userId2) OR " +
            "(c.sender.id = :userId2 AND c.receiver.id = :userId1)")
    Optional<Connection> findExistingConnection(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    // --- THE N+1 FIXES ---

    /**
     * N+1 PATCH: Fetches all accepted friends.
     * The 'JOIN FETCH' commands force Hibernate to pull the Sender and Receiver
     * user profiles in the exact same SQL query, reducing 100 queries down to 1.
     */
    @Query("SELECT c FROM Connection c " +
            "JOIN FETCH c.sender " +
            "JOIN FETCH c.receiver " +
            "WHERE c.status = 'ACCEPTED' AND (c.sender.id = :userId OR c.receiver.id = :userId)")
    List<Connection> findAllAcceptedConnectionsForUser(@Param("userId") UUID userId);

    /**
     * N+1 PATCH: Fetches pending requests.
     * When a user opens their notification tray, they need to see the names and profile
     * pictures of the people who sent them requests. We JOIN FETCH the sender to avoid
     * secondary queries while mapping the UI data.
     */
    @Query("SELECT c FROM Connection c " +
            "JOIN FETCH c.sender " +
            "JOIN FETCH c.receiver " +
            "WHERE c.receiver.id = :receiverId AND c.status = :status")
    List<Connection> findByReceiverIdAndStatus(@Param("receiverId") UUID receiverId, @Param("status") ConnectionStatus status);
}