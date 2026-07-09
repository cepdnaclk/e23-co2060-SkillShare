package com.zenware.skillsharebackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SkillshareBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillshareBackendApplication.class, args);
    }

}
