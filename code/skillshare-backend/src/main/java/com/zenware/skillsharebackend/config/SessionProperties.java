package com.zenware.skillsharebackend.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.session")
@Getter
@Setter
public class SessionProperties {

    private int pendingResponseTimeoutHours = 24;

    @PostConstruct
    public void validate() {
        if (pendingResponseTimeoutHours <= 0) {
            throw new IllegalArgumentException(
                    "Invalid configuration: app.session.pending-response-timeout-hours must be strictly positive, but was "
                    + pendingResponseTimeoutHours);
        }
    }
}
