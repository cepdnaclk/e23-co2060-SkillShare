package com.zenware.skillsharebackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Disable CSRF (Cross-Site Request Forgery) because we are using stateless JWTs
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Configure which endpoints are public and which are private
                .authorizeHttpRequests(auth -> auth
                        // WHITELIST: Anyone can access the login and register endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        // You can also whitelist your public profile endpoints here if needed

                        // BLACKLIST: Every other single endpoint requires a valid JWT Token!
                        .anyRequest().authenticated()
                )

                // 3. Set Session Management to STATELESS (No cookies! Every request must have a JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 4. Tell Spring to use our database Auth Provider
                .authenticationProvider(authenticationProvider)

                // 5. Insert our Custom JWT Bouncer BEFORE the standard password filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}