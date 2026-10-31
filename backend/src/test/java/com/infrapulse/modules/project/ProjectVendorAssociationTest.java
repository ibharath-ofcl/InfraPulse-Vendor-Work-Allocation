package com.infrapulse.modules.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectManagerAssignmentRepository;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.dto.AssociateVendorRequest;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectVendorAssociationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ProjectVendorRepository projectVendorRepository;

    @Autowired
    private ProjectManagerAssignmentRepository pmAssignmentRepository;

    @Autowired
    private com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository workAssignmentRepository;

    @Autowired
    private com.infrapulse.modules.workzone.repository.WorkZoneRepository workZoneRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User adminUser;
    private User pmUser;
    private User otherPmUser;
    private User vendorUser;
    private String adminToken;
    private String pmToken;
    private String otherPmToken;
    private String vendorToken;

    private Project project;
    private Vendor activeVendor;
    private Vendor pendingVendor;

    @BeforeEach
    void setUp() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        pmAssignmentRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Platform Admin",
            "admin@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999991",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));

        pmUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Assigned PM",
            "pm@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999992",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));

        otherPmUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Other PM",
            "otherpm@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999993",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));

        vendorUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor Rep",
            "vendor@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999994",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        adminToken = jwtTokenProvider.generateAccessToken(adminUser);
        pmToken = jwtTokenProvider.generateAccessToken(pmUser);
        otherPmToken = jwtTokenProvider.generateAccessToken(otherPmUser);
        vendorToken = jwtTokenProvider.generateAccessToken(vendorUser);

        project = projectRepository.save(new Project(
            null, "PRJ-ASSOC-1", "Fiber Infra Project", "Fiber deployment",
            ProjectType.FIBER_OPTIC, "Client", "Chennai", "Tamil Nadu", "Chennai",
            "600001", LocalDate.now(), LocalDate.now().plusMonths(6),
            new BigDecimal("5000000.00"), ProjectStatus.ACTIVE, pmUser, adminUser
        ));

        activeVendor = vendorRepository.save(new Vendor(
            null, "VND-ACT-1", "Apex Infra Works", "Ramesh",
            "apex@infra.com", "9876543210", null, "Industrial Zone",
            "Chennai", "Chennai", "Tamil Nadu", "600032", null, null,
            VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING), null, adminUser
        ));

        pendingVendor = vendorRepository.save(new Vendor(
            null, "VND-PND-1", "Pending Services", "Suresh",
            "pending@services.com", "9876543211", null, "Industrial Zone",
            "Chennai", "Chennai", "Tamil Nadu", "600032", null, null,
            VendorStatus.PENDING_VERIFICATION, Set.of(ServiceCategory.TRENCHING), null, adminUser
        ));
    }

    @Test
    @DisplayName("Active vendor can be associated with a project")
    void associateVendor_Active_Success() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(activeVendor.getId(), "Approved for trenching work.");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.vendorId", is(activeVendor.getId())))
            .andExpect(jsonPath("$.data.associationStatus", is("ACTIVE")))
            .andExpect(jsonPath("$.data.notes", is("Approved for trenching work.")));
    }

    @Test
    @DisplayName("Assigned Project Manager can associate active vendor")
    void associateVendor_AssignedPM_Success() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(activeVendor.getId(), "PM assigned.");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + pmToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.vendorId", is(activeVendor.getId())));
    }

    @Test
    @DisplayName("Unassigned PM cannot associate vendor (403 Forbidden)")
    void associateVendor_UnassignedPM_Forbidden() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(activeVendor.getId(), "Attempting association.");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + otherPmToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Inactive or Pending vendor cannot be associated (400 Bad Request)")
    void associateVendor_PendingVendor_Rejected() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(pendingVendor.getId(), "Should fail.");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Only ACTIVE vendors can be associated")));
    }

    @Test
    @DisplayName("Nonexistent vendor association is rejected (404 Not Found)")
    void associateVendor_NonexistentVendor_NotFound() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(UUID.randomUUID().toString(), "Nonexistent");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Duplicate active association is rejected (409 Conflict)")
    void associateVendor_DuplicateActive_Conflict() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(activeVendor.getId(), "Initial");

        // 1. First association succeeds
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // 2. Second active association attempt fails with 409 Conflict
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message", containsString("already actively associated")));
    }

    @Test
    @DisplayName("Association removal deactivates status and preserves history")
    void removeVendorAssociation_Success() throws Exception {
        // Associate first
        AssociateVendorRequest req = new AssociateVendorRequest(activeVendor.getId(), "Initial");
        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // Remove association
        mockMvc.perform(delete("/api/v1/projects/" + project.getId() + "/vendors/" + activeVendor.getId())
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)));

        // Verify project details shows the association with DEACTIVATED status (history preserved)
        mockMvc.perform(get("/api/v1/projects/" + project.getId())
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.associatedVendors", hasSize(1)))
            .andExpect(jsonPath("$.data.associatedVendors[0].associationStatus", is("DEACTIVATED")))
            .andExpect(jsonPath("$.data.associatedVendors[0].deactivatedAt", notNullValue()));
    }

    @Test
    @DisplayName("Unauthorized user (Vendor) cannot associate vendors")
    void associateVendor_Vendor_Forbidden() throws Exception {
        AssociateVendorRequest req = new AssociateVendorRequest(activeVendor.getId(), "Unauthorized");

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/vendors")
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @AfterEach
    void tearDown() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        pmAssignmentRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();
    }
}
