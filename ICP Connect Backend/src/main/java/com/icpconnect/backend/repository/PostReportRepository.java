package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.PostReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    boolean existsByReporterIdAndPostId(Long reporterId, Long postId);

    long countByStatus(String status);

    @Query("SELECT r FROM PostReport r WHERE :status IS NULL OR r.status = :status ORDER BY r.createdAt DESC")
    Page<PostReport> findByStatusOrAll(@Param("status") String status, Pageable pageable);
}
