package com.infrapulse.modules.auth.service;

import com.infrapulse.modules.auth.dto.*;
import com.infrapulse.modules.auth.model.*;
import com.infrapulse.modules.auth.repository.AuthenticationAuditRepository;
import com.infrapulse.modules.auth.repository.RefreshTokenRepository;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.security.HashUtil;
import com.infrapulse.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class AuthService {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationAuditRepository auditRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final long refreshTokenExpirationMs;

    public AuthService(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        AuthenticationAuditRepository auditRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider,
        @Value("${security.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditRepository = auditRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = request.email().toLowerCase().trim();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            recordAudit(null, normalizedEmail, "LOGIN_FAILURE", "FAILURE", ipAddress, userAgent, "User not found");
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            recordAudit(user.getId(), normalizedEmail, "LOGIN_FAILURE", "FAILURE", ipAddress, userAgent, "Invalid credentials");
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            recordAudit(user.getId(), normalizedEmail, "LOGIN_LOCKED", "FAILURE", ipAddress, userAgent, "Account locked");
            throw new IllegalStateException("Account is locked. Please contact a platform administrator.");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            recordAudit(user.getId(), normalizedEmail, "LOGIN_INACTIVE", "FAILURE", ipAddress, userAgent, "Account inactive");
            throw new IllegalStateException("Account is inactive. Please contact a platform administrator.");
        }

        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String rawRefreshToken = HashUtil.generateSecureRandomToken(32);
        String tokenHash = HashUtil.sha256(rawRefreshToken);

        Instant expiresAt = Instant.now().plusMillis(refreshTokenExpirationMs);
        RefreshToken refreshToken = new RefreshToken(user, tokenHash, expiresAt, userAgent);
        refreshTokenRepository.save(refreshToken);

        // Set HttpOnly refresh token cookie
        setRefreshTokenCookie(httpResponse, rawRefreshToken, (int) (refreshTokenExpirationMs / 1000));

        recordAudit(user.getId(), normalizedEmail, "LOGIN_SUCCESS", "SUCCESS", ipAddress, userAgent, "Role: " + user.getRole().name());

        return AuthResponse.of(
            accessToken,
            jwtTokenProvider.getAccessTokenExpirationSeconds(),
            UserDto.fromEntity(user),
            user.getRole().getPermissions()
        );
    }

    @Transactional
    public AuthResponse refresh(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String rawRefreshToken = extractRefreshToken(httpRequest);
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token missing");
        }

        String tokenHash = HashUtil.sha256(rawRefreshToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            recordAudit(null, null, "REFRESH_FAILURE", "FAILURE", ipAddress, userAgent, "Unknown token");
            throw new IllegalArgumentException("Invalid refresh token");
        }

        RefreshToken oldToken = tokenOpt.get();
        User user = oldToken.getUser();

        // Token reuse detection: if old token was already revoked, revoke entire session family for this user
        if (oldToken.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(user.getId(), Instant.now());
            clearRefreshTokenCookie(httpResponse);
            recordAudit(user.getId(), user.getEmail(), "REFRESH_REUSE_DETECTED", "FAILURE", ipAddress, userAgent, "Token family revoked");
            throw new SecurityException("Revoked refresh token presented. All active sessions invalidated for security.");
        }

        if (oldToken.isExpired()) {
            oldToken.revoke();
            refreshTokenRepository.save(oldToken);
            clearRefreshTokenCookie(httpResponse);
            recordAudit(user.getId(), user.getEmail(), "REFRESH_EXPIRED", "FAILURE", ipAddress, userAgent, "Token expired");
            throw new IllegalArgumentException("Refresh token has expired");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            oldToken.revoke();
            refreshTokenRepository.save(oldToken);
            clearRefreshTokenCookie(httpResponse);
            throw new IllegalStateException("User account is not active");
        }

        // Rotate: revoke old token and create new
        oldToken.revoke();
        refreshTokenRepository.save(oldToken);

        String newRawRefreshToken = HashUtil.generateSecureRandomToken(32);
        String newTokenHash = HashUtil.sha256(newRawRefreshToken);
        Instant expiresAt = Instant.now().plusMillis(refreshTokenExpirationMs);

        RefreshToken newToken = new RefreshToken(user, newTokenHash, expiresAt, userAgent);
        refreshTokenRepository.save(newToken);

        setRefreshTokenCookie(httpResponse, newRawRefreshToken, (int) (refreshTokenExpirationMs / 1000));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        recordAudit(user.getId(), user.getEmail(), "REFRESH_SUCCESS", "SUCCESS", ipAddress, userAgent, null);

        return AuthResponse.of(
            newAccessToken,
            jwtTokenProvider.getAccessTokenExpirationSeconds(),
            UserDto.fromEntity(user),
            user.getRole().getPermissions()
        );
    }

    @Transactional
    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String rawRefreshToken = extractRefreshToken(httpRequest);
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = HashUtil.sha256(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.revoke();
                refreshTokenRepository.save(token);
                recordAudit(token.getUser().getId(), token.getUser().getEmail(), "LOGOUT", "SUCCESS", ipAddress, userAgent, null);
            });
        }

        clearRefreshTokenCookie(httpResponse);
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new CurrentUserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getRole().getPermissions()
        );
    }

    @Transactional
    public UserDto register(RegisterRequest request, HttpServletRequest httpRequest) {
        String normalizedEmail = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email address already exists.");
        }

        // Public registration assigns default restricted VENDOR role; privileged accounts created via Admin API
        User user = new User(
            null,
            request.fullName().trim(),
            normalizedEmail,
            passwordEncoder.encode(request.password()),
            request.phoneNumber(),
            UserRole.VENDOR,
            UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);
        recordAudit(savedUser.getId(), savedUser.getEmail(), "USER_REGISTERED", "SUCCESS", getClientIp(httpRequest), httpRequest.getHeader("User-Agent"), "Role: VENDOR");

        return UserDto.fromEntity(savedUser);
    }

    private String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        // Fallback to custom header if cookie unavailable
        String header = request.getHeader("X-Refresh-Token");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return null;
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token, int maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, token)
            .httpOnly(true)
            .secure(false) // Set to true if running behind TLS/HTTPS in production
            .sameSite("Lax")
            .path("/api/auth")
            .maxAge(Duration.ofSeconds(maxAgeSeconds))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/api/auth")
            .maxAge(Duration.ZERO)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void recordAudit(String userId, String email, String eventType, String outcome, String ip, String ua, String meta) {
        try {
            AuthenticationAudit audit = new AuthenticationAudit(userId, email, eventType, outcome, ip, ua, meta);
            auditRepository.save(audit);
        } catch (Exception e) {
            // Do not break flow if audit logging fails
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
