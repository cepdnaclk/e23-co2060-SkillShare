package com.zenware.skillsharebackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import com.zenware.skillsharebackend.service.JwtService;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Only intercept the initial CONNECT frame
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            // ADD THIS TO DEBUG:
            System.out.println("STOMP Connect Attempt. Auth Header: " + authHeader);

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                // 1. Extract email/username from your JWT
                String userEmail = jwtService.extractUsername(token);

                // 2. Validate token and load user
                if (userEmail != null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                    if (jwtService.isTokenValid(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );

                        // 3. Attach the authenticated user to the WebSocket session!
                        accessor.setUser(authentication);
                        System.out.println("✅ STOMP Auth Successful for User: " + userEmail);
                    } else {
                         System.out.println("❌ STOMP Auth Failed: Invalid Token for User: " + userEmail);
                    }
                }
            } else {
                 System.out.println("❌ STOMP Auth Failed: Missing or invalid Authorization header");
            }
            // Create and return a new message so the mutated accessor headers are propagated to the session
            return org.springframework.messaging.support.MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
        }
        return message;
    }
}