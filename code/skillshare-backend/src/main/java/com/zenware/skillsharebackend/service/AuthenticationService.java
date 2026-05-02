package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AuthenticationRequest;
import com.zenware.skillsharebackend.dto.AuthenticationResponse;
import com.zenware.skillsharebackend.dto.RegisterRequest;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // --- MVP SECURITY PATCH: Block fake/disposable emails ---
    private static final String STRICT_EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$";

    private static final List<String> DISPOSABLE_DOMAINS = List.of(
            "mailinator.com", "10minutemail.com", "tempmail.com",
            "guerrillamail.com", "yopmail.com", "dropmail.me"
    );

    private void validateEmailSecurity(String email) {
        // 1. Check if it's completely empty
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty.");
        }

        // 2. Check if it actually looks like a real email using Regex
        if (!email.matches(STRICT_EMAIL_REGEX)) {
            throw new IllegalArgumentException("Invalid email format. Please provide a real email address.");
        }

        // 3. Extract the domain (e.g., "gmail.com" from "test@gmail.com")
        String domain = email.substring(email.indexOf("@") + 1).toLowerCase();

        // 4. Block known fake/spam domains
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            throw new IllegalArgumentException("Disposable or temporary email addresses are strictly prohibited.");
        }
    }
    // --------------------------------------------------------

    // 1. REGISTER NEW USER
    public AuthenticationResponse register(RegisterRequest request) {

        // SECURITY CHECK: Validate email format and block disposable domains FIRST!
        validateEmailSecurity(request.getEmail());

        // Ensure email isn't already taken
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already taken!");
        }

        // Create the user
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        // LOGIC: Hash the password BEFORE saving to the database!
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(Role.USER);
        user.setCredits(100);

        userRepository.save(user);

        // Generate the token instantly so they don't have to log in immediately after registering
        String jwtToken = jwtService.generateToken(user);

        // Return the token AND the user details!
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    // 2. LOG IN EXISTING USER
    public AuthenticationResponse authenticate(AuthenticationRequest request) {

        // LOGIC: This manager (which we configured in ApplicationConfig) automatically
        // hashes the incoming password and compares it to the database.
        // If it's wrong, it throws an exception here and halts the code!
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // If we get to this line, the password was 100% correct.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        // Generate their token
        String jwtToken = jwtService.generateToken(user);

        // Return the token AND the user details!
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}