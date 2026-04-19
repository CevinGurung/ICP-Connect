package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.AuthRequest;
import com.icpconnect.backend.dto.AuthResponse;
import com.icpconnect.backend.dto.RefreshRequest;
import com.icpconnect.backend.dto.RegisterRequest;
import com.icpconnect.backend.dto.OtpSendRequest;
import com.icpconnect.backend.service.AuthService;
import com.icpconnect.backend.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        otpService.generateAndSendOtp(request.email(), "Registration");
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully to " + request.email()));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request);
        return ResponseEntity.noContent().build(); // 204
    }
}


