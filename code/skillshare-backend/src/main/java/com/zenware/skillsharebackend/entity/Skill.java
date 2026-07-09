package com.zenware.skillsharebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "skills")
@Data
@Builder // LOGIC: Added Builder pattern for consistency
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id; // LOGIC: Upgraded to UUID!

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "category")
    private String category;
}