package com.zenware.skillsharebackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketAuthInterceptor authInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the URL the React frontend will use to open the connection.
        // setAllowedOriginPatterns("*") prevents CORS blocks during local development.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
                //.withSockJS(); // Fallback for older browsers
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages sent FROM the server TO the client will start with this prefix
        registry.enableSimpleBroker("/user");

        // Messages sent FROM the client TO the server must start with this prefix
        registry.setApplicationDestinationPrefixes("/app");

        // Tells the broker how to route private, user-to-user messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}