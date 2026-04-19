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
        // Validate OTP using Cache
        otpService.validateOtp(request.email(), request.otp());

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setUserName(request.userName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhoneNumber(request.phoneNumber());
        user.setRole(Role.STUDENT);
        user.setActiveStatus(true);

        User saved = userRepository.save(user);

        // issue tokens
        String accessToken = jwtUtil.generateAccessToken(saved);
        String refreshToken = jwtUtil.generateRefreshToken(saved);

        storeRefreshToken(saved, refreshToken);

        return new AuthResponse(accessToken, refreshToken, false);
    }

    /* ===================== LOGIN ===================== */

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

        if (!user.isActiveStatus()) {
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
        if (!user.isActiveStatus()) {
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
