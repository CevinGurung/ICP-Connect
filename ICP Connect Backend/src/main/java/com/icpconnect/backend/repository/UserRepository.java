package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Role;
import com.icpconnect.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Tier 1: Match Program, Year, and Section
    List<User> findByProgramAndYearAndSectionAndIdNot(String program, String year, String section, Long id);

    // Tier 2: Match Program
    List<User> findByProgramAndIdNot(String program, Long id);

    // Tier 3: Random fallback
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM users u WHERE u.id != ?1 ORDER BY RANDOM() LIMIT ?2", nativeQuery = true)
    List<User> findRandomUsers(Long excludeId, int limit);

    // Admin: count by role
    long countByRole(Role role);

    // Admin: paginated with optional role and search filter
    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:search IS NULL OR LOWER(u.fullName) LIKE :search OR LOWER(u.email) LIKE :search OR LOWER(u.userName) LIKE :search)")
    Page<User> findByRoleAndSearch(@Param("role") Role role, @Param("search") String search, Pageable pageable);

    // Admin: count users joined today
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :start")
    long countByCreatedAtAfter(@Param("start") java.time.LocalDateTime start);
}
