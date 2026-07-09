package com.zenware.skillsharebackend.config;

import com.zenware.skillsharebackend.entity.AuthProvider;
import com.zenware.skillsharebackend.entity.User;
import com.zenware.skillsharebackend.repository.UserRepository;
import com.zenware.skillsharebackend.service.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend.oauth2-redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        // Extract GitHub details
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Fallbacks for GitHub: Sometimes 'name' is null, so we use 'login' (username)
        if (name == null) {
            name = oAuth2User.getAttribute("login");
        }

        // If the user's GitHub email is set to private, GitHub might return null.
        if (email == null) {
            email = oAuth2User.getAttribute("login") + "@github.local"; // Safe fallback
        }

        // Check if user exists in database
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
        } else {
            // Create new user
            user = new User();
            user.setEmail(email);
            // We use fullName as defined in your User entity
            user.setFullName(name);
            user.setAuthProvider(AuthProvider.GITHUB);
            user.setCredits(50); // Start them off with some Escrow credits!
            user = userRepository.save(user);
        }

        // Generate the custom JWT using your JwtService
        String token = jwtService.generateToken(user);

        // Check if the user needs to complete their profile
        boolean needsProfileCompletion = !Boolean.TRUE.equals(user.getIsProfileCompleted());

        // Redirect to the frontend with the token attached to the URL
        String frontendRedirectUrl = redirectUrl + "?token=" + token;
        if (needsProfileCompletion) {
            frontendRedirectUrl += "&needsProfileCompletion=true";
        }
        
        getRedirectStrategy().sendRedirect(request, response, frontendRedirectUrl);
    }
}