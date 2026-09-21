package com.evcharging.userservice.dto;

public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String role; // ROLE_USER or ROLE_ADMIN

    public RegisterRequest() {}

    public RegisterRequest(String username, String email, String password, String fullName, String role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
    }

    public String getUsername() { return username; }
    public String getEmail()    { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }
    public String getRole()     { return role; }

    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email)       { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setRole(String role)         { this.role = role; }
}
