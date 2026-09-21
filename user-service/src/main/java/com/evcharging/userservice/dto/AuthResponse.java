package com.evcharging.userservice.dto;

/**
 * Authentication response DTO.
 * Includes both access token (short-lived, 24h) and refresh token (7 days).
 */
public class AuthResponse {
    private String token;          // Short-lived access token (24h)
    private String refreshToken;   // Long-lived refresh token (7 days)
    private Long expiresIn;        // Access token lifetime in seconds
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;

    public AuthResponse() {}

    public AuthResponse(String token, String refreshToken, Long id, String username,
                        String email, String fullName, String role) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.expiresIn = 86400L; // 24 hours in seconds
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    // Legacy constructor for backwards compatibility
    public AuthResponse(String token, Long id, String username, String email, String fullName, String role) {
        this(token, null, id, username, email, fullName, role);
    }

    public String getToken()         { return token; }
    public String getRefreshToken()  { return refreshToken; }
    public Long getExpiresIn()       { return expiresIn; }
    public Long getId()              { return id; }
    public String getUsername()      { return username; }
    public String getEmail()         { return email; }
    public String getFullName()      { return fullName; }
    public String getRole()          { return role; }

    public void setToken(String token)               { this.token = token; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public void setExpiresIn(Long expiresIn)         { this.expiresIn = expiresIn; }
    public void setId(Long id)                       { this.id = id; }
    public void setUsername(String username)         { this.username = username; }
    public void setEmail(String email)               { this.email = email; }
    public void setFullName(String fullName)         { this.fullName = fullName; }
    public void setRole(String role)                 { this.role = role; }
}
