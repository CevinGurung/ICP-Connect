package com.icpconnect.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "post_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false, length = 500)
    private String mediaUrl;

    @Column(nullable = false, length = 20)
    private String mediaType; // IMAGE or VIDEO

    @Column(nullable = false)
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    
    public PostMedia(Post post, String mediaUrl, String mediaType) {
        this.post = post;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType;
    }
}
