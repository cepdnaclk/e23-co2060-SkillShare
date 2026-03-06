package com.zenware.skillsharebackend.repository;

import com.zenware.skillsharebackend.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    // Spring Data JPA automatically writes the SQL for this!
    List<Skill> findByNameContainingIgnoreCase(String keyword);
}