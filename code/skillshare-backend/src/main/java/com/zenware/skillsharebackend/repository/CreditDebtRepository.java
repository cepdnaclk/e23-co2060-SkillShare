package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.CreditDebt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CreditDebtRepository extends JpaRepository<CreditDebt, UUID> {
}
