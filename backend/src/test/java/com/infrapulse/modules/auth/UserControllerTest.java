package com.infrapulse.modules.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.modules.auth.dto.CreateUserRequest;
import com.infrapulse.modules.auth.dto.UpdateRoleRequest;
import com.infrapulse.modules.auth.dto.UpdateStatusRequest;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.RefreshTokenRepository;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.security.JwtTokenProvider;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {

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

    private User adminUser;
    private User vendorUser;
    private String adminToken;
    private String vendorToken;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Platform Administrator",
            "admin@infrapulse.gov.in",
            passwordEncoder.encode("Admin@12345!"),
            "+91 80 1234 5678",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));

        vendorUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Contractor One",
            "vendor@infrapulse.gov.in",
            passwordEncoder.encode("Vendor@12345!"),
            "+91 80 9876 5432",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        adminToken = jwtTokenProvider.generateAccessToken(adminUser);
        vendorToken = jwtTokenProvider.generateAccessToken(vendorUser);
    }

    @Test
    @DisplayName("User Management: Admin can list all users")
    void getAllUsers_AdminSuccess() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data", hasSize(2)))
            .andExpect(jsonPath("$.data[?(@.email == 'admin@infrapulse.gov.in')]", not(empty())));
    }

    @Test
    @DisplayName("User Management: Non-admin (Vendor) receives 403 Forbidden when listing users")
    void getAllUsers_VendorForbidden() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + vendorToken))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User Management: Unauthenticated access receives 401 Unauthorized")
    void getAllUsers_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("User Management: Admin can create a new Project Manager user")
    void createUser_AdminSuccess() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "Priya Sharma",
            "priya.sharma@infrapulse.gov.in",
            "SecurePass123!",
            "+91 98450 12345",
            UserRole.PROJECT_MANAGER
        );

        mockMvc.perform(post("/api/users")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.email", is("priya.sharma@infrapulse.gov.in")))
            .andExpect(jsonPath("$.data.role", is("PROJECT_MANAGER")));
    }

    @Test
    @DisplayName("User Management: Admin can update a user's role")
    void updateUserRole_Success() throws Exception {
        UpdateRoleRequest request = new UpdateRoleRequest(UserRole.FIELD_ENGINEER);

        mockMvc.perform(patch("/api/users/" + vendorUser.getId() + "/role")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.role", is("FIELD_ENGINEER")));
    }

    @Test
    @DisplayName("User Management Safeguard: Admin cannot demote their own account role")
    void updateUserRole_SelfDemotionRejected() throws Exception {
        UpdateRoleRequest request = new UpdateRoleRequest(UserRole.VENDOR);

        mockMvc.perform(patch("/api/users/" + adminUser.getId() + "/role")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)))
            .andExpect(jsonPath("$.message", containsString("Administrators cannot demote their own account role")));
    }

    @Test
    @DisplayName("User Management Safeguard: Cannot deactivate the sole active Platform Administrator")
    void updateUserStatus_LastAdminProtected() throws Exception {
        UpdateStatusRequest request = new UpdateStatusRequest(UserStatus.INACTIVE);

        mockMvc.perform(patch("/api/users/" + adminUser.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)))
            .andExpect(jsonPath("$.message", containsString("Cannot deactivate or lock the sole active Platform Administrator")));
    }
}
