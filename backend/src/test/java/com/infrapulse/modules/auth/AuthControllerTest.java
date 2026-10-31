package com.infrapulse.modules.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.modules.auth.dto.LoginRequest;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.RefreshTokenRepository;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.security.HashUtil;
import com.infrapulse.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User activeAdmin;
    private User activeVendor;
    private User lockedUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();

        activeAdmin = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Platform Administrator",
            "admin@infrapulse.gov.in",
            passwordEncoder.encode("Admin@12345!"),
            "+91 80 1234 5678",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));

        activeVendor = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Contractor One",
            "vendor@infrapulse.gov.in",
            passwordEncoder.encode("Vendor@12345!"),
            "+91 80 9876 5432",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        lockedUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Locked User",
            "locked@infrapulse.gov.in",
            passwordEncoder.encode("Locked@12345!"),
            null,
            UserRole.VENDOR,
            UserStatus.LOCKED
        ));

        inactiveUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Inactive User",
            "inactive@infrapulse.gov.in",
            passwordEncoder.encode("Inactive@12345!"),
            null,
            UserRole.VENDOR,
            UserStatus.INACTIVE
        ));
    }

    @Test
    @DisplayName("Login: Successful login returns JWT access token, user details, and sets HttpOnly refresh cookie")
    void login_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@infrapulse.gov.in", "Admin@12345!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.accessToken", notNullValue()))
            .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
            .andExpect(jsonPath("$.data.user.email", is("admin@infrapulse.gov.in")))
            .andExpect(jsonPath("$.data.user.role", is("PLATFORM_ADMIN")))
            .andExpect(jsonPath("$.data.permissions", hasItem("MANAGE_USERS")))
            .andExpect(header().exists("Set-Cookie"))
            .andExpect(cookie().exists("refreshToken"))
            .andExpect(cookie().httpOnly("refreshToken", true));
    }

    @Test
    @DisplayName("Login: Invalid password returns 400 Bad Request with generic error message")
    void login_InvalidPassword() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@infrapulse.gov.in", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)))
            .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Login: Unknown email returns 400 Bad Request with generic error message to prevent enumeration")
    void login_UnknownEmail() throws Exception {
        LoginRequest loginRequest = new LoginRequest("unknown@infrapulse.gov.in", "SomePassword123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)))
            .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Login: Locked account is rejected")
    void login_LockedAccount() throws Exception {
        LoginRequest loginRequest = new LoginRequest("locked@infrapulse.gov.in", "Locked@12345!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)))
            .andExpect(jsonPath("$.message", containsString("Account is locked")));
    }

    @Test
    @DisplayName("Login: Inactive account is rejected")
    void login_InactiveAccount() throws Exception {
        LoginRequest loginRequest = new LoginRequest("inactive@infrapulse.gov.in", "Inactive@12345!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)))
            .andExpect(jsonPath("$.message", containsString("Account is inactive")));
    }

    @Test
    @DisplayName("Refresh: Valid refresh token issues a new access token and rotates the refresh token")
    void refresh_Success() throws Exception {
        // 1. Perform initial login to receive cookie
        LoginRequest loginRequest = new LoginRequest("admin@infrapulse.gov.in", "Admin@12345!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie);

        // 2. Call refresh using the cookie
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.accessToken", notNullValue()))
            .andExpect(cookie().exists("refreshToken"))
            .andReturn();

        Cookie newRefreshCookie = refreshResult.getResponse().getCookie("refreshToken");
        assertNotNull(newRefreshCookie);

        // 3. Replay attack detection: reusing the OLD revoked token must trigger 401 and session invalidation
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshCookie))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Logout: Revokes refresh session and clears cookie")
    void logout_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@infrapulse.gov.in", "Admin@12345!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie);

        mockMvc.perform(post("/api/auth/logout")
                .cookie(refreshCookie))
            .andExpect(status().isOk())
            .andExpect(cookie().value("refreshToken", ""))
            .andExpect(cookie().maxAge("refreshToken", 0));
    }

    @Test
    @DisplayName("Current User: /api/auth/me returns current user when valid JWT provided")
    void me_Success() throws Exception {
        String token = jwtTokenProvider.generateAccessToken(activeAdmin);

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.email", is("admin@infrapulse.gov.in")))
            .andExpect(jsonPath("$.data.role", is("PLATFORM_ADMIN")))
            .andExpect(jsonPath("$.data.permissions", hasItem("MANAGE_USERS")));
    }

    @Test
    @DisplayName("Current User: /api/auth/me returns 401 when unauthenticated")
    void me_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
    }
}
