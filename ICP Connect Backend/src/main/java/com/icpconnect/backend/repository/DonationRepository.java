package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Donation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    Optional<Donation> findByTransactionUuid(String transactionUuid);

    @Query("SELECT d FROM Donation d WHERE d.status = :status ORDER BY d.createdAt DESC")
    Page<Donation> findByStatusOrderByCreatedAtDesc(@Param("status") String status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.status = 'COMPLETED'")
    BigDecimal sumCompletedDonations();

    long countByStatus(String status);

    @Query(value = "SELECT DATE(created_at) as day, COUNT(*) as count, SUM(amount) as total FROM donations WHERE status = 'COMPLETED' AND created_at >= :start GROUP BY DATE(created_at) ORDER BY day", nativeQuery = true)
    List<Object[]> countDonationsPerDay(@Param("start") LocalDateTime start);
}
