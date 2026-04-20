package com.icpconnect.backend.repository;

import com.icpconnect.backend.entity.Follow;
import com.icpconnect.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
    
    long countByFollowerId(Long followerId);
    
    long countByFollowingId(Long followingId);
    
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    
    java.util.List<Follow> findByFollowingId(Long userId);
    
    java.util.List<Follow> findByFollowerId(Long userId);
    
    void deleteByFollowerAndFollowing(User follower, User following);
}
