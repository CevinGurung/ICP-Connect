package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    boolean existsByReporterIdAndPostId(Long reporterId, Long postId);
}
