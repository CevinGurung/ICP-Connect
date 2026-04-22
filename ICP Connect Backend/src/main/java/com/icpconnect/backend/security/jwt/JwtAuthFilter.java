package com.icpconnect.backend.security.jwt;

import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.icpconnect.backend.security.SecurityUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
// LEARNING NOTE: 'OncePerRequestFilter' ensures that this filter runs exactly ONCE for every request that comes to our server.
// Think of this class as a 'Security Bouncer' who checks if you have a valid pass (JWT) before you're allowed to see the data.
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    // LEARNING NOTE: This is the method where the magic happens. Every request passes through here.
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // If already authenticated, continue
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        // LEARNING NOTE: We look for a header named 'Authorization' that starts with 'Bearer '.
        // If it's missing, we just let the request continue. If the requested URL is private, 
        // Spring Security will block it later because no user was set in the Context.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Removes 'Bearer ' to get the raw token

        // LEARNING NOTE: Here we check if the token is mathematically valid and not expired.
        if (!jwtUtil.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = jwtUtil.extractEmail(token);
        if (email == null || email.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !userOpt.get().isActive()) {
            filterChain.doFilter(request, response);
            return;
        }

        User user = userOpt.get();

        // LEARNING NOTE: SecurityUser is our custom wrapper that Spring Security understands.
        SecurityUser securityUser = new SecurityUser(user);

        // LEARNING NOTE: If everything is good, we create an 'Authentication' object.
        // This is like giving the user a 'Verified' badge for this specific request.
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        securityUser,
                        null,
                        securityUser.getAuthorities()
                );

        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        
        // LEARNING NOTE: This line is CRITICAL. We save the verified user into Spring's 'SecurityContext'.
        // Now, any other part of our app (like Controllers) will know WHO is making the request.
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
