package com.evcharging.userservice;

import com.evcharging.userservice.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtUtil (user-service).
 * All tests run without a Spring context — pure POJO testing.
 */
class JwtUtilTest {

    private JwtUtil jwtUtil;

    // Must be at least 32 bytes for HS256
    private static final String SECRET      = "ev_charging_soa_secret_key_super_secure_32_bytes_long_12345";
    private static final long   EXPIRATION  = 86_400_000L; // 24 h
    private static final long   REFRESH_EXP = 604_800_000L; // 7 days
    // A very short expiry used to test expired-token scenarios
    private static final long   TINY_EXP    = 1L; // 1 ms

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret",           SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration",       EXPIRATION);
        ReflectionTestUtils.setField(jwtUtil, "refreshExpiration", REFRESH_EXP);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Token generation & claim extraction
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateToken – subject, role, userId and type claims are correctly embedded")
    void generateToken_claimsAreCorrect() {
        String token = jwtUtil.generateToken("harsha", "ROLE_USER", 7L);

        assertNotNull(token, "Token must not be null");
        assertEquals("harsha",    jwtUtil.extractUsername(token));
        assertEquals("ROLE_USER", jwtUtil.extractRole(token));
        assertEquals(7L,          jwtUtil.extractUserId(token));
    }

    @Test
    @DisplayName("generateRefreshToken – type claim is REFRESH and userId is present")
    void generateRefreshToken_typeIsRefresh() {
        String token = jwtUtil.generateRefreshToken("harsha", 7L);

        assertEquals("harsha", jwtUtil.extractUsername(token));
        assertEquals(7L, jwtUtil.extractUserId(token));
        // type must be REFRESH (validated in UserController /refresh endpoint)
        String type = jwtUtil.extractAllClaims(token).get("type", String.class);
        assertEquals("REFRESH", type);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Token validation
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("validateToken – valid fresh token returns true")
    void validateToken_validTokenReturnsTrue() {
        String token = jwtUtil.generateToken("admin", "ROLE_ADMIN", 1L);
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    @DisplayName("validateToken – tampered token (altered payload) returns false")
    void validateToken_tamperedTokenReturnsFalse() {
        String token = jwtUtil.generateToken("admin", "ROLE_ADMIN", 1L);
        // Corrupt the payload section (index 1 in dot-separated JWT)
        String[] parts = token.split("\\.");
        // Replace the payload with garbage
        String tampered = parts[0] + ".AAAAAAAAAAAAAAAAAAAAAA." + parts[2];

        assertFalse(jwtUtil.validateToken(tampered));
    }

    @Test
    @DisplayName("validateToken – completely bogus string returns false")
    void validateToken_bogusTokenReturnsFalse() {
        assertFalse(jwtUtil.validateToken("this.is.not.a.jwt"));
    }

    @Test
    @DisplayName("validateToken – null returns false without throwing")
    void validateToken_nullReturnsFalse() {
        assertFalse(jwtUtil.validateToken(null));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Expired token
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isTokenExpired – token with 1 ms expiry is expired after sleep")
    void isTokenExpired_expiredTokenReturnsTrue() throws InterruptedException {
        // Create a JwtUtil with a 1-ms expiry
        JwtUtil shortLived = new JwtUtil();
        ReflectionTestUtils.setField(shortLived, "secret",           SECRET);
        ReflectionTestUtils.setField(shortLived, "expiration",       TINY_EXP);
        ReflectionTestUtils.setField(shortLived, "refreshExpiration", REFRESH_EXP);

        String token = shortLived.generateToken("harsha", "ROLE_USER", 1L);
        Thread.sleep(50); // ensure expiry

        assertTrue(shortLived.isTokenExpired(token));
    }

    @Test
    @DisplayName("validateToken – expired token returns false")
    void validateToken_expiredTokenReturnsFalse() throws InterruptedException {
        JwtUtil shortLived = new JwtUtil();
        ReflectionTestUtils.setField(shortLived, "secret",           SECRET);
        ReflectionTestUtils.setField(shortLived, "expiration",       TINY_EXP);
        ReflectionTestUtils.setField(shortLived, "refreshExpiration", REFRESH_EXP);

        String token = shortLived.generateToken("harsha", "ROLE_USER", 1L);
        Thread.sleep(50);

        assertFalse(shortLived.validateToken(token));
    }

    @Test
    @DisplayName("extractAllClaims – expired token throws ExpiredJwtException")
    void extractAllClaims_expiredTokenThrowsExpiredJwtException() throws InterruptedException {
        JwtUtil shortLived = new JwtUtil();
        ReflectionTestUtils.setField(shortLived, "secret",           SECRET);
        ReflectionTestUtils.setField(shortLived, "expiration",       TINY_EXP);
        ReflectionTestUtils.setField(shortLived, "refreshExpiration", REFRESH_EXP);

        String token = shortLived.generateToken("harsha", "ROLE_USER", 1L);
        Thread.sleep(50);

        assertThrows(ExpiredJwtException.class, () -> shortLived.extractAllClaims(token));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Blacklist (logout)
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("blacklistToken – blacklisted token fails validateToken")
    void blacklistToken_blacklistedTokenFailsValidation() {
        String token = jwtUtil.generateToken("harsha", "ROLE_USER", 5L);
        assertTrue(jwtUtil.validateToken(token), "Token should be valid before blacklisting");

        jwtUtil.blacklistToken(token);

        assertTrue(jwtUtil.isBlacklisted(token), "Token should be in blacklist");
        assertFalse(jwtUtil.validateToken(token), "Blacklisted token must fail validation");
    }

    @Test
    @DisplayName("blacklistToken – blacklisting null or blank does not throw")
    void blacklistToken_nullAndBlankAreSafe() {
        assertDoesNotThrow(() -> jwtUtil.blacklistToken(null));
        assertDoesNotThrow(() -> jwtUtil.blacklistToken(""));
        assertDoesNotThrow(() -> jwtUtil.blacklistToken("   "));
    }

    @Test
    @DisplayName("isBlacklisted – non-blacklisted token returns false")
    void isBlacklisted_nonBlacklistedTokenReturnsFalse() {
        String token = jwtUtil.generateToken("harsha", "ROLE_USER", 3L);
        assertFalse(jwtUtil.isBlacklisted(token));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Access vs Refresh token differentiation
    // ──────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateToken – type claim is ACCESS")
    void generateToken_typeClaimIsAccess() {
        String token = jwtUtil.generateToken("harsha", "ROLE_USER", 1L);
        String type  = jwtUtil.extractAllClaims(token).get("type", String.class);
        assertEquals("ACCESS", type);
    }

    @Test
    @DisplayName("validateToken – refresh token passes validateToken (different type, same secret)")
    void validateToken_refreshTokenPassesValidation() {
        String refreshToken = jwtUtil.generateRefreshToken("harsha", 1L);
        assertTrue(jwtUtil.validateToken(refreshToken),
                "Refresh token must pass signature validation even though type=REFRESH");
    }
}
