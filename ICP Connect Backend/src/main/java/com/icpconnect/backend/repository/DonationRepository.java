package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    Optional<Donation> findByTransactionUuid(String transactionUuid);
}
