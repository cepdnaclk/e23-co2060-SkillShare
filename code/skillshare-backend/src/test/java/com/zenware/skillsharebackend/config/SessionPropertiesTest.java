package com.zenware.skillsharebackend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

public class SessionPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(org.springframework.boot.autoconfigure.AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
            .withUserConfiguration(SessionProperties.class);

    @Test
    void testDefaultValue() {
        contextRunner.run(context -> {
            SessionProperties properties = context.getBean(SessionProperties.class);
            assertThat(properties.getPendingResponseTimeoutHours()).isEqualTo(24);
        });
    }

    @Test
    void testPositiveCustomValue() {
        contextRunner.withPropertyValues("app.session.pending-response-timeout-hours=48")
                .run(context -> {
                    SessionProperties properties = context.getBean(SessionProperties.class);
                    assertThat(properties.getPendingResponseTimeoutHours()).isEqualTo(48);
                });
    }

    @Test
    void testZeroValueRejected() {
        contextRunner.withPropertyValues("app.session.pending-response-timeout-hours=0")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .getRootCause()
                            .isInstanceOf(IllegalArgumentException.class)
                            .hasMessageContaining("app.session.pending-response-timeout-hours must be strictly positive");
                });
    }

    @Test
    void testNegativeValueRejected() {
        contextRunner.withPropertyValues("app.session.pending-response-timeout-hours=-1")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .getRootCause()
                            .isInstanceOf(IllegalArgumentException.class)
                            .hasMessageContaining("app.session.pending-response-timeout-hours must be strictly positive");
                });
    }

    @Test
    void testNonNumericValueRejected() {
        contextRunner.withPropertyValues("app.session.pending-response-timeout-hours=twenty-four")
                .run(context -> {
                    assertThat(context).hasFailed();
                    // TypeMismatchException happens during binding before PostConstruct
                    assertThat(context.getStartupFailure().getMessage())
                            .contains("Could not bind properties to 'SessionProperties'");
                });
    }
}
