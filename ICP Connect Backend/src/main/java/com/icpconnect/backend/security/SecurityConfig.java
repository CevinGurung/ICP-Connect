package com.icpconnect.backend.security;

import com.icpconnect.backend.security.jwt.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
// LEARNING NOTE: @Configuration tells Spring that this class is a place where we define 'Settings' or 'Beans'.
// @EnableMethodSecurity allows us to use @PreAuthorize on our controllers to check user roles easily.
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    // LEARNING NOTE: This method is the HEART of our security. It defines which URLs are public and which are private.
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // CORS + CSRF
                // LEARNING NOTE: CORS (Cross-Origin Resource Sharing) allows our Frontend (port 5173) to talk to our Backend (port 8848).
                // CSRF is disabled because we are using JWT tokens, which aren't vulnerable to standard CSRF attacks like cookies are.
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())

                // Stateless session (JWT)
                // LEARNING NOTE: 'STATELESS' means the server doesn't remember who is logged in via a session ID stored in memory.
                // Instead, every single request must come with a JWT token that we verify. This makes our app more scalable!
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization rules
                // LEARNING NOTE: .permitAll() means anyone can access these. .authenticated() means you NEED a valid token.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/uploads/**", "/ws/**").permitAll()
                        .anyRequest().authenticated()
                )

                // Force 401 instead of 403 for unauthenticated access
                // LEARNING NOTE: If someone tries to access a private page without a token, we send back a 401 (Unauthorized) 
                // instead of a 403 (Forbidden). This helps the frontend know it's time to show the login screen.
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                // Add JWT filter
                // LEARNING NOTE: This tells Spring to run our 'jwtAuthFilter' BEFORE the standard 'UsernamePasswordAuthenticationFilter'.
                // It's like a bouncer checking your ID card (the token) before you enter the club (the API).
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    // LEARNING NOTE: This is our 'Secret Sauce' for passwords. We NEVER store passwords in plain text.
    // BCrypt hashes them so even if the database is leaked, the original passwords are safe.
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Allow your React app (Vite) to call the backend.
     * Frontend: http://localhost:5173
     * Backend:  http://localhost:8848
     */
    @Bean
    // LEARNING NOTE: This configuration explicitly tells the browser: "It is okay for the website at port 5173 
    // to ask for data from this server at port 8848." Without this, the browser would block the requests.
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow all local dev origins more flexibly
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:[*]",
            "http://127.0.0.1:[*]"
        ));
        
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
