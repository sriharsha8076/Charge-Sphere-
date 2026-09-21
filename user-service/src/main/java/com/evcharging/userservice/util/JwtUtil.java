package com.evcharging.userservice.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JWT utility for the User Service.
 *
 * Issues short-lived ACCESS tokens (24h) and longer-lived REFRESH tokens (7 days).
 * Maintains an in-memory blacklist for logged-out access tokens.
 *
 * Secret is loaded from the JWT_SECRET environment variable
 * (falls back to the configured value if the env var is not set).
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration; // 24h = 86400000 ms

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration; // 7 days = 604800000 ms

    // In-memory token blacklist for logout. In production, use Redis.
    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ─── Token Generation ──────────────────────────────────────────────────────

    /**
     * Generate a short-lived ACCESS token (24h).
     * Contains username (subject), role, and userId claims.
     */
    public String generateToken(String username, String role, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("userId", userId)
                .claim("type", "ACCESS")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate a long-lived REFRESH token (7 days).
     * Used only to obtain a new access token — does not carry role claims.
     */
    public String generateRefreshToken(String username, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("type", "REFRESH")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ─── Token Parsing & Validation ─────────────────────────────────────────────

    /**
     * Extract all claims from a token. Throws on expiry or invalid signature.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public Long extractUserId(String token) {
        Object uid = extractAllClaims(token).get("userId");
        return uid != null ? Long.valueOf(uid.toString()) : null;
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractAllClaims(token).getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Validate token: check signature, expiry, and blacklist.
     */
    public boolean validateToken(String token) {
        try {
            if (blacklistedTokens.contains(token)) return false;
            extractAllClaims(token); // throws if invalid/expired
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Blacklist (Logout) ──────────────────────────────────────────────────

    /**
     * Invalidate an access token on logout.
     * The token is stored in-memory until the application restarts.
     */
    public void blacklistToken(String token) {
        if (token != null && !token.isBlank()) {
            blacklistedTokens.add(token);
        }
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
}
