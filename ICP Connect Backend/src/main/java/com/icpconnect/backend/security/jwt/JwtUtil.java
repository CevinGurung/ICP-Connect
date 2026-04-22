package com.icpconnect.backend.security.jwt;

import com.icpconnect.backend.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
// LEARNING NOTE: JwtUtil is like a 'Key Maker' and 'ID Checker'. 
// It handles creating the physical tokens and reading the information inside them.
public class JwtUtil {

    private final String jwtSecret;
    private final long accessExpMs;
    private final long refreshExpMs;

    private SecretKey signingKey;

    public JwtUtil(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.access-exp-ms}") long accessExpMs,
            @Value("${app.jwt.refresh-exp-ms}") long refreshExpMs
    ) {
        this.jwtSecret = jwtSecret;
        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }

    @PostConstruct
    // LEARNING NOTE: @PostConstruct means this runs immediately after the app starts.
    // We prepare our 'Signing Key' once so we can use it to sign every single token.
    public void init() {
        // HS256 requires at least 32 bytes secret. If shorter, JJWT throws an error.
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /* ===================== TOKEN GENERATION ===================== */

    // LEARNING NOTE: This creates a 'Short-term' token (e.g., 15 mins).
    // We include basic user info (Claims) so the Frontend doesn't have to call the database 
    // just to know the user's name or role.
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpMs);

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole().name())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // LEARNING NOTE: This creates a 'Long-term' token (e.g., 7 days).
    // It is used ONLY to get a new Access Token when the old one expires.
    // If the Access Token is a 'Visitor Pass', the Refresh Token is a 'Subscription'.
    public String generateRefreshToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshExpMs);

        // Keep refresh token minimal (subject + iat + exp). Do NOT put sensitive data inside.
        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /* ===================== CLAIMS EXTRACTION ===================== */

    // LEARNING NOTE: This 'unlocks' the token using our secret key to read the data inside.
    // If the token was tampered with (even by 1 character), this will throw an error.
    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }

    /* ===================== VALIDATION ===================== */

    // LEARNING NOTE: A token is valid only if its signature matches our secret key 
    // AND the current time is before its 'Expiration' date.
    public boolean isTokenValid(String token) {
        try {
            extractClaims(token); // validates signature + expiration
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }
}
