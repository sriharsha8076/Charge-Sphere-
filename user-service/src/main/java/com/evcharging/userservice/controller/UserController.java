package com.evcharging.userservice.controller;

import com.evcharging.userservice.dto.AuthResponse;
import com.evcharging.userservice.dto.LoginRequest;
import com.evcharging.userservice.dto.RegisterRequest;
import com.evcharging.userservice.entity.User;
import com.evcharging.userservice.entity.Vehicle;
import com.evcharging.userservice.repository.UserRepository;
import com.evcharging.userservice.repository.VehicleRepository;
import com.evcharging.userservice.util.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * User Service REST Controller.
 *
 * Handles registration, login, logout, token refresh, profile management,
 * and vehicle management.
 *
 * Security:
 *   - Passwords are BCrypt-hashed before storage (never stored in plain text)
 *   - Login verifies credentials against BCrypt hash
 *   - Login issues both an access token (24h) and a refresh token (7 days)
 *   - Logout blacklists the submitted access token server-side
 *   - /refresh endpoint issues a new access token from a valid refresh token
 */
@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class UserController {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, VehicleRepository vehicleRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder(10);
    }

    // ─── Authentication ────────────────────────────────────────────────────────

    /**
     * POST /users/register
     * Register a new EV user or admin. Password is BCrypt-hashed before storage.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 6 characters");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        // BCrypt hash — password is NEVER stored in plain text
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName() != null ? request.getFullName() : request.getUsername());
        user.setRole(request.getRole() != null ? request.getRole() : "ROLE_USER");

        User savedUser = userRepository.save(user);

        // Auto-assign a default EV vehicle for convenience
        Vehicle defaultVehicle = new Vehicle();
        defaultVehicle.setUserId(savedUser.getId());
        defaultVehicle.setModel("Tata Nexon EV");
        defaultVehicle.setBatteryCapacityKwh(40.5);
        defaultVehicle.setRegistrationNumber("AP16 EV " + (1000 + savedUser.getId()));
        vehicleRepository.save(defaultVehicle);

        String accessToken = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getRole(), savedUser.getId());
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getUsername(), savedUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                accessToken, refreshToken,
                savedUser.getId(), savedUser.getUsername(),
                savedUser.getEmail(), savedUser.getFullName(), savedUser.getRole()
        ));
    }

    /**
     * POST /users/login
     * Authenticate user. Returns access token + refresh token on success.
     * Passwords are verified against BCrypt hash — never compared in plain text.
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        String reqPass = request.getPassword() != null ? request.getPassword().trim() : "";
        boolean valid = passwordEncoder.matches(reqPass, user.getPassword());

        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());

        return ResponseEntity.ok(new AuthResponse(
                accessToken, refreshToken,
                user.getId(), user.getUsername(),
                user.getEmail(), user.getFullName(), user.getRole()
        ));
    }

    /**
     * POST /users/logout
     * Invalidate the submitted access token by adding it to the server-side blacklist.
     * Subsequent requests with this token will receive 401 Unauthorized.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "No token provided"));
        }
        String token = authHeader.substring(7);
        jwtUtil.blacklistToken(token);
        return ResponseEntity.ok(Map.of("message", "Successfully logged out. Token has been invalidated."));
    }

    /**
     * POST /users/refresh
     * Exchange a valid refresh token for a new access token.
     * The refresh token is validated for signature and expiry.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Refresh token is required"));
        }

        try {
            Claims claims = jwtUtil.extractAllClaims(refreshToken);
            String tokenType = claims.get("type", String.class);
            if (!"REFRESH".equals(tokenType)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid token type"));
            }

            String username = claims.getSubject();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            String newAccessToken = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
            return ResponseEntity.ok(Map.of(
                    "token", newAccessToken,
                    "expiresIn", 86400L,
                    "username", user.getUsername(),
                    "role", user.getRole()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired refresh token"));
        }
    }

    // ─── Profile Management ────────────────────────────────────────────────────

    /**
     * GET /users/{id}
     * Retrieve user profile. Password field is NOT returned in response.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> {
                    // Never return password hash in API response
                    u.setPassword("[PROTECTED]");
                    return ResponseEntity.ok((Object) u);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    /**
     * PUT /users/{id}
     * Update user profile (fullName, email). Cannot update password or role via this endpoint.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    if (updatedUser.getFullName() != null) user.setFullName(updatedUser.getFullName());
                    if (updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
                    user.setPassword("[PROTECTED]"); // mask before returning
                    return ResponseEntity.ok((Object) userRepository.save(user));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    // ─── Vehicle Management ────────────────────────────────────────────────────

    @GetMapping("/{userId}/vehicles")
    public ResponseEntity<List<Vehicle>> getUserVehicles(@PathVariable Long userId) {
        return ResponseEntity.ok(vehicleRepository.findByUserId(userId));
    }

    @PostMapping("/{userId}/vehicles")
    public ResponseEntity<Vehicle> addVehicle(@PathVariable Long userId, @RequestBody Vehicle vehicle) {
        vehicle.setUserId(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleRepository.save(vehicle));
    }

    // ─── Admin / Stats ─────────────────────────────────────────────────────────

    @GetMapping("/count")
    public ResponseEntity<Long> getTotalUserCount() {
        return ResponseEntity.ok(userRepository.count());
    }
}
