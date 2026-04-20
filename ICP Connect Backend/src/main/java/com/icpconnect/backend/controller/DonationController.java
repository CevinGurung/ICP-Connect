package com.icpconnect.backend.controller;

import com.icpconnect.backend.dto.DonationRequest;
import com.icpconnect.backend.dto.EsewaInitiateResponse;
import com.icpconnect.backend.security.SecurityUser;
import com.icpconnect.backend.service.DonationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @PostMapping("/initiate")
    public ResponseEntity<EsewaInitiateResponse> initiate(
            @RequestBody DonationRequest request,
            @AuthenticationPrincipal SecurityUser principal) {
        return ResponseEntity.ok(donationService.initiateDonation(request, principal.getUser()));
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestBody Map<String, String> payload) {
        String transactionUuid = payload.get("transactionUuid");
        donationService.completeDonation(transactionUuid);
        return ResponseEntity.ok().build();
    }
}
