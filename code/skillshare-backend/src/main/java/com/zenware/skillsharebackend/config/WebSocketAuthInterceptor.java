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
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.support.MessageBuilder;
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

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new MessageDeliveryException("WebSocket authentication failed");
            }

            String token = authHeader.substring(7);
            if (token.trim().isEmpty()) {
                throw new MessageDeliveryException("WebSocket authentication failed");
            }

            try {
                // 1. Extract email/username from your JWT
                String userEmail = jwtService.extractUsername(token);

                if (userEmail == null) {
                    throw new MessageDeliveryException("WebSocket authentication failed");
                }

                // 2. Validate token and load user
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                if (!jwtService.isTokenValid(token, userDetails)) {
                    throw new MessageDeliveryException("WebSocket authentication failed");
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );

                // 3. Attach the authenticated user to the WebSocket session!
                accessor.setUser(authentication);
                return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());

            } catch (io.jsonwebtoken.JwtException | org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                // Explicitly catch JWT parsing errors (malformed, expired, signature) and missing users.
                // Do not catch other unexpected exceptions (e.g. database down), let them propagate.
                throw new MessageDeliveryException("WebSocket authentication failed");
            }
        }
        return message;
    }
}