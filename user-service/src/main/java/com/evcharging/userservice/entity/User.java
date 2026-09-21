package com.evcharging.userservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role; // ROLE_USER, ROLE_ADMIN

    // No-arg constructor (required by JPA)
    public User() {}

    // All-arg constructor
    public User(Long id, String username, String email, String password, String fullName, String role) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
    }

    // Getters
    public Long getId()         { return id; }
    public String getUsername() { return username; }
    public String getEmail()    { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }
    public String getRole()     { return role; }

    // Setters
    public void setId(Long id)             { this.id = id; }
    public void setUsername(String u)      { this.username = u; }
    public void setEmail(String e)         { this.email = e; }
    public void setPassword(String p)      { this.password = p; }
    public void setFullName(String f)      { this.fullName = f; }
    public void setRole(String r)          { this.role = r; }
}
