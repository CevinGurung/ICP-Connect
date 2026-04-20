package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Tier 1: Match Program, Year, and Section
    java.util.List<User> findByProgramAndYearAndSectionAndIdNot(String program, String year, String section, Long id);

    // Tier 2: Match Program
    java.util.List<User> findByProgramAndIdNot(String program, Long id);

    // Tier 3: Random fallback
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM users u WHERE u.id != ?1 ORDER BY RANDOM() LIMIT ?2", nativeQuery = true)
    java.util.List<User> findRandomUsers(Long excludeId, int limit);
}
