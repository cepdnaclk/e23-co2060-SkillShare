package com.zenware.skillsharebackend.config;

import com.zenware.skillsharebackend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService; // We will configure this bean in Phase 5!

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Extract the Authorization header from the incoming request
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. If there is no token, or it doesn't start with "Bearer ", reject it
        // (but let it proceed to see if it's a public endpoint like /register)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract the actual JWT (Removing "Bearer " which is 7 characters long)
        jwt = authHeader.substring(7);

        // 4. Extract the user's email using the JwtService we built in Phase 3
        userEmail = jwtService.extractUsername(jwt);

        // 5. If we have an email, and the user is NOT already authenticated in this specific request cycle...
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 6. Fetch the user details from the database (we will tell Spring how to do)
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 7. Check if the token is mathematically valid and not expired
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // 8. Create a Spring Security token to officially "Log In" the user for this single request
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // We don't need to pass the password here
                        userDetails.getAuthorities() // Passes their Role (USER/ADMIN)
                );

                // 9. Add extra details (like IP address, browser info, etc.)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 10. Update the Security Context. The user is now officially authenticated.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 11. Pass the request onto the next stage (your Controllers)
        filterChain.doFilter(request, response);
    }
}