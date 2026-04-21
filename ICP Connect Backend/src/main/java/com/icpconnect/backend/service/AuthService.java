package com.icpconnect.backend.service;

import com.icpconnect.backend.dto.*;
import com.icpconnect.backend.entity.RefreshToken;
import com.icpconnect.backend.entity.Role;
import com.icpconnect.backend.entity.User;
import com.icpconnect.backend.repository.RefreshTokenRepository;
import com.icpconnect.backend.repository.UserRepository;
import com.icpconnect.backend.security.jwt.JwtUtil;
import com.icpconnect.backend.security.jwt.TokenHashUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TokenHashUtil tokenHashUtil;
    private final OtpService otpService;

    private final long refreshExpMs;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            TokenHashUtil tokenHashUtil,
            OtpService otpService,
            @Value("${app.jwt.refresh-exp-ms}") long refreshExpMs
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.tokenHashUtil = tokenHashUtil;
        this.otpService = otpService;
        this.refreshExpMs = refreshExpMs;
    }

    /* ===================== REGISTER ===================== */

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        // Validate OTP using Cache
        otpService.validateOtp(normalizedEmail, request.otp());

        if (!normalizedEmail.endsWith("@icp.edu.np")) {
            throw new IllegalArgumentException("Registration is restricted to @icp.edu.np emails.");
        }

        if (request.password() == null || request.password().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Auto-detect role from email pattern
        String localPart = normalizedEmail.split("@")[0];
        boolean isTeacher = !localPart.matches(".*\\.[as]\\d{2}$");

        Role role = isTeacher ? Role.TEACHER : Role.STUDENT;

        User user = new User();
        user.setFullName(request.fullName());
        user.setUserName(request.userName());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setProgram(request.program());
        user.setYear(request.year());
        user.setSection(request.section());
        user.setRole(role);
        user.setActive(true);

        if (isTeacher) {
            user.setSubject(request.subject());
            user.setSpecialty(request.specialty());
        }

        User saved = userRepository.save(user);

        // issue tokens
        String accessToken = jwtUtil.generateAccessToken(saved);
        String refreshToken = jwtUtil.generateRefreshToken(saved);

        storeRefreshToken(saved, refreshToken);

        return new AuthResponse(accessToken, refreshToken, false);
    }

    /* ===================== LOGIN ===================== */

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is inactive");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        // If OTP is not provided, trigger MFA step
        if (request.otp() == null || request.otp().isBlank()) {
            otpService.generateAndSendOtp(user.getEmail(), "Login");
            return new AuthResponse(null, null, true);
        }

        // If OTP is provided, validate it
        otpService.validateOtp(user.getEmail(), request.otp());

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        storeRefreshToken(user, refreshToken);

        return new AuthResponse(accessToken, refreshToken, false);
    }

    /* ===================== REFRESH ===================== */

    public AuthResponse refresh(RefreshRequest request) {
        String rawRefresh = request.refreshToken();

        // 1) Validate JWT signature/exp for refresh token
        if (!jwtUtil.isTokenValid(rawRefresh)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        // 2) Check DB record (revoked/expired)
        String tokenHash = tokenHashUtil.sha256Base64(rawRefresh);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (stored.isRevoked()) {
            throw new IllegalArgumentException("Refresh token revoked");
        }

        if (stored.isExpired()) {
            throw new IllegalArgumentException("Refresh token expired");
        }

        User user = stored.getUser();
        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is inactive");
        }

        // 3) Rotation (recommended): revoke old refresh token and issue new pair
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newAccess = jwtUtil.generateAccessToken(user);
        String newRefresh = jwtUtil.generateRefreshToken(user);

        storeRefreshToken(user, newRefresh);

        return new AuthResponse(newAccess, newRefresh, false);
    }

    /* ===================== LOGOUT ===================== */

    public void logout(RefreshRequest request) {
        String rawRefresh = request.refreshToken();
        String tokenHash = tokenHashUtil.sha256Base64(rawRefresh);

        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    /* ===================== HELPERS ===================== */

    private void storeRefreshToken(User user, String rawRefreshToken) {
        String tokenHash = tokenHashUtil.sha256Base64(rawRefreshToken);

        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(tokenHash);
        rt.setRevoked(false);
        rt.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpMs / 1000));

        refreshTokenRepository.save(rt);
    }

}
