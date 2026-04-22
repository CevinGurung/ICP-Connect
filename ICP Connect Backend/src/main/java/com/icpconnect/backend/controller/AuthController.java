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
// LEARNING NOTE: @RestController means this class handles incoming web requests (HTTP).
// Every method here returns data directly (usually as JSON) to the Frontend.
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
    }

    @PostMapping("/send-otp")
    // LEARNING NOTE: This is Step 1 of registration. We send a 6-digit code to the user's email 
    // to make sure they actually own that email address.
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        otpService.generateAndSendOtp(request.email(), "Registration");
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully to " + request.email()));
    }

    @PostMapping("/register")
    // LEARNING NOTE: Step 2 of registration. Once they have the OTP, they send it along with 
    // their chosen password. If the OTP is correct, we save the user to the database.
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    // LEARNING NOTE: This handles logging in. It checks the credentials and, if MFA is enabled, 
    // triggers an OTP check before finally giving the user their JWT tokens.
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    // LEARNING NOTE: Tokens don't last forever. When the Access Token expires, the Frontend calls 
    // this endpoint with a 'Refresh Token' to get a brand new Access Token without asking the user to login again.
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


