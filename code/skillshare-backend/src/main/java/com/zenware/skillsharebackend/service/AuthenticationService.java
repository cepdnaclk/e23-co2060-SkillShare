package com.zenware.skillsharebackend.service;

import com.zenware.skillsharebackend.dto.AuthenticationRequest;
import com.zenware.skillsharebackend.dto.AuthenticationResponse;
import com.zenware.skillsharebackend.dto.RegisterRequest;
import com.zenware.skillsharebackend.entity.Role;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
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

    public AuthenticationResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already taken!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setCredits(100);

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .xp(user.getXp())
                .level(user.getLevel())
                .credits(user.getCredits())
                .reputationScore(user.getReputationScore())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (DisabledException e) {
            // 🛑 Catch Spring Security's DisabledException directly when isEnabled() is false
            throw new IllegalArgumentException("Your account has been suspended by an administrator.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Your account has been suspended by an administrator.");
        }

        String jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .xp(user.getXp())
                .level(user.getLevel())
                .credits(user.getCredits())
                .reputationScore(user.getReputationScore())
                .build();
    }
}