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

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // 1. REGISTER NEW USER
    public AuthenticationResponse register(RegisterRequest request) {

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
        return new AuthenticationResponse(jwtToken);
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
        return new AuthenticationResponse(jwtToken);
    }
}