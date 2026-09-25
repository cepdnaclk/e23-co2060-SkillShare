package com.zenware.skillsharebackend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        @Value("${cors.allowed.origins}")
        private List<String> allowedOrigins;

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final AuthenticationProvider authenticationProvider;

        // --- NEW: INJECT OUR CUSTOM SUCCESS HANDLER ---
        private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

        // --- NEW: INJECT OUR CUSTOM API SECURITY HANDLERS ---
        private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
        private final RestAccessDeniedHandler restAccessDeniedHandler;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                        // 1. TURN ON CORS HERE!
                        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                        // 2. Disable CSRF (Cross-Site Request Forgery) because we are using stateless JWTs
                        .csrf(AbstractHttpConfigurer::disable)

                        // 3. Configure which endpoints are public and which are private
                        .authorizeHttpRequests(auth -> auth
                                // WHITELIST: Anyone can access the login, register, and public skills endpoints
                                // --- NEW: ADD OAUTH2 ENDPOINTS TO WHITELIST ---
                                .requestMatchers("/api/auth/**", "/login/oauth2/**", "/oauth2/**", "/ws/**").permitAll()
                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/skills/**").permitAll()
                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/feedback/**", "/api/user-skills/**").permitAll()
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                .requestMatchers("/api/sessions/expire-overdue").hasRole("ADMIN")
                                // FIX (this bug): admin-only manual trigger for the availability cleanup engine
                                .requestMatchers("/api/availability/cleanup-expired").hasRole("ADMIN")

                                // BLACKLIST: Every other single endpoint requires a valid JWT Token!
                                .anyRequest().authenticated())

                        // --- NEW: ADD OAUTH2 LOGIN CONFIGURATION ---
                        .oauth2Login(oauth2 -> oauth2
                                .successHandler(oAuth2AuthenticationSuccessHandler)
                        )

                        // 4. Set Session Management to STATELESS (No cookies! Every request must have a JWT)
                        .sessionManagement(session -> session
                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                        // 5. Tell Spring to use our database Auth Provider
                        .authenticationProvider(authenticationProvider)

                        // 6. Insert our Custom JWT Bouncer BEFORE the standard password filter
                        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                        // 7. --- NEW: API SECURITY EXCEPTION HANDLING ---
                        .exceptionHandling(exceptions -> exceptions
                                .defaultAuthenticationEntryPointFor(
                                        restAuthenticationEntryPoint,
                                        request -> request.getServletPath().startsWith("/api/")
                                )
                                .defaultAccessDeniedHandlerFor(
                                        restAccessDeniedHandler,
                                        request -> request.getServletPath().startsWith("/api/")
                                )
                        );

                return http.build();
        }

        // --- DEFINE THE CORS RULES! ---
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // Let React (3000) or Vite/Vue/Angular (5173, 4200) talk to the backend
                configuration.setAllowedOrigins(allowedOrigins);

                // Allow all standard HTTP methods
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

                // Allow the frontend to send the 'Authorization' header (which holds our JWT!)
                configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

                // Allow credentials (important if you ever add cookies later)
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration); // Apply to ALL endpoints

                return source;
        }
}