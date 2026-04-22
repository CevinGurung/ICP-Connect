package com.icpconnect.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
// LEARNING NOTE: @Entity tells Hibernate that this Java class represents a Table in our Database.
// Think of this as a blueprint for the 'User' data we store.
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // LEARNING NOTE: @Id marks this field as the 'Primary Key'. 
    // IDENTITY means the Database will automatically count up (1, 2, 3...) for each new user.
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 50)
    private String userName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    // LEARNING NOTE: @JsonIgnore ensures the password hash is NEVER sent to the Frontend. 
    // It's a critical safety measure to keep users' secrets stay on the server.
    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(length = 50)
    private String program;

    @Column(length = 10)
    private String year;

    @Column(length = 50)
    private String section;

    @Column(length = 500)
    private String profileImageUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 100)
    private String subject;

    @Column(length = 200)
    private String specialty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public User(String fullName, String userName, String email, String passwordHash,
                Role role) {
        this.fullName = fullName;
        this.userName = userName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }
}
