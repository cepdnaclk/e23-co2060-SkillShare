package com.zenware.skillsharebackend;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class PostgresIntegrationSmokeIT extends IntegrationTestBase {

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void testPostgresConnection() {
        Object result = entityManager.createNativeQuery("SELECT 1").getSingleResult();
        assertEquals(1, ((Number) result).intValue());
    }
}
