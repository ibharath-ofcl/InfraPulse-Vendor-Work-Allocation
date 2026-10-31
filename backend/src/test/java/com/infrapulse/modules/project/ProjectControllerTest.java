package com.infrapulse.modules.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.dto.AssignProjectManagerRequest;
import com.infrapulse.modules.project.dto.CreateProjectRequest;
import com.infrapulse.modules.project.dto.UpdateProjectRequest;
import com.infrapulse.modules.project.dto.UpdateProjectStatusRequest;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectManagerAssignmentRepository;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

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
    private User pmUser1;
    private User pmUser2;
    private User vendorUser;
    private User inactivePmUser;
    private String adminToken;
    private String pmToken1;
    private String pmToken2;
    private String vendorToken;

    @BeforeEach
    void setUp() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        pmAssignmentRepository.deleteAll();
        projectRepository.deleteAll();
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

        pmUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Project Manager 1",
            "pm1@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999992",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));

        pmUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Project Manager 2",
            "pm2@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999993",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));

        vendorUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor Representative",
            "vendor@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999994",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        inactivePmUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Inactive PM",
            "inactivepm@test.com",
            passwordEncoder.encode("Pass@123!"),
            "+91 9999999995",
            UserRole.PROJECT_MANAGER,
            UserStatus.INACTIVE
        ));

        adminToken = jwtTokenProvider.generateAccessToken(adminUser);
        pmToken1 = jwtTokenProvider.generateAccessToken(pmUser1);
        pmToken2 = jwtTokenProvider.generateAccessToken(pmUser2);
        vendorToken = jwtTokenProvider.generateAccessToken(vendorUser);
    }

    @Test
    @DisplayName("Admin creates a project successfully")
    void createProject_Admin_Success() throws Exception {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setProjectName("Chennai Fiber Network Expansion");
        req.setDescription("Fiber connectivity expansion across operational zones.");
        req.setProjectType(ProjectType.FIBER_OPTIC);
        req.setClientName("Infrastructure Development Authority");
        req.setRegion("Chennai North");
        req.setState("Tamil Nadu");
        req.setDistrict("Chennai");
        req.setPrimaryPincode("600001");
        req.setStartDate(LocalDate.of(2026, 11, 10));
        req.setTargetEndDate(LocalDate.of(2027, 6, 30));
        req.setBudget(new BigDecimal("25000000.00"));
        req.setProjectManagerId(pmUser1.getId());

        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.projectCode", notNullValue()))
            .andExpect(jsonPath("$.data.projectName", is("Chennai Fiber Network Expansion")))
            .andExpect(jsonPath("$.data.status", is("PLANNED")))
            .andExpect(jsonPath("$.data.projectManager.id", is(pmUser1.getId())));
    }

    @Test
    @DisplayName("Vendor cannot create projects (403 Forbidden)")
    void createProject_Vendor_Forbidden() throws Exception {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setProjectName("Unauthorized Project");
        req.setProjectType(ProjectType.ROAD_INFRASTRUCTURE);
        req.setClientName("Client");
        req.setRegion("South");
        req.setState("Karnataka");
        req.setDistrict("Bengaluru");
        req.setPrimaryPincode("560001");
        req.setStartDate(LocalDate.now());
        req.setTargetEndDate(LocalDate.now().plusMonths(3));
        req.setBudget(new BigDecimal("100000.00"));

        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Invalid PIN code is rejected")
    void createProject_InvalidPincode_Rejected() throws Exception {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setProjectName("Invalid Pin Project");
        req.setProjectType(ProjectType.UTILITY);
        req.setClientName("Client");
        req.setRegion("North");
        req.setState("Delhi");
        req.setDistrict("New Delhi");
        req.setPrimaryPincode("00123"); // invalid pincode format
        req.setStartDate(LocalDate.now());
        req.setTargetEndDate(LocalDate.now().plusMonths(3));
        req.setBudget(new BigDecimal("50000.00"));

        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Negative budget is rejected")
    void createProject_NegativeBudget_Rejected() throws Exception {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setProjectName("Negative Budget Project");
        req.setProjectType(ProjectType.UTILITY);
        req.setClientName("Client");
        req.setRegion("North");
        req.setState("Delhi");
        req.setDistrict("New Delhi");
        req.setPrimaryPincode("110001");
        req.setStartDate(LocalDate.now());
        req.setTargetEndDate(LocalDate.now().plusMonths(3));
        req.setBudget(new BigDecimal("-5000.00"));

        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Invalid date range (target before start) is rejected")
    void createProject_InvalidDateRange_Rejected() throws Exception {
        CreateProjectRequest req = new CreateProjectRequest();
        req.setProjectName("Inverted Dates Project");
        req.setProjectType(ProjectType.ELECTRICAL);
        req.setClientName("Client");
        req.setRegion("West");
        req.setState("Maharashtra");
        req.setDistrict("Mumbai");
        req.setPrimaryPincode("400001");
        req.setStartDate(LocalDate.of(2027, 1, 1));
        req.setTargetEndDate(LocalDate.of(2026, 1, 1)); // before start date
        req.setBudget(new BigDecimal("500000.00"));

        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Target completion date must not be before start date")));
    }

    @Test
    @DisplayName("Project manager assignment succeeds for valid active manager")
    void assignProjectManager_Success() throws Exception {
        Project project = projectRepository.save(new Project(
            null, "PRJ-BLR-001", "Bengaluru Metro Fiber", "Description",
            ProjectType.FIBER_OPTIC, "Client", "Bengaluru", "Karnataka", "Bengaluru",
            "560001", LocalDate.now(), LocalDate.now().plusMonths(6),
            new BigDecimal("10000000.00"), ProjectStatus.PLANNED, null, adminUser
        ));

        AssignProjectManagerRequest req = new AssignProjectManagerRequest(pmUser1.getId());

        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/manager")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.projectManager.id", is(pmUser1.getId())));
    }

    @Test
    @DisplayName("Inactive manager assignment is rejected")
    void assignProjectManager_InactiveManager_Rejected() throws Exception {
        Project project = projectRepository.save(new Project(
            null, "PRJ-BLR-002", "Bengaluru Metro Fiber 2", "Description",
            ProjectType.FIBER_OPTIC, "Client", "Bengaluru", "Karnataka", "Bengaluru",
            "560001", LocalDate.now(), LocalDate.now().plusMonths(6),
            new BigDecimal("10000000.00"), ProjectStatus.PLANNED, null, adminUser
        ));

        AssignProjectManagerRequest req = new AssignProjectManagerRequest(inactivePmUser.getId());

        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/manager")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Cannot assign inactive user")));
    }

    @Test
    @DisplayName("Project manager sees only assigned projects")
    void listProjects_ProjectManager_Scoping() throws Exception {
        // Project 1 assigned to pmUser1
        projectRepository.save(new Project(
            null, "PRJ-PM1", "PM1 Project", "Description",
            ProjectType.TELECOM, "Client", "Zone 1", "State", "District",
            "600001", LocalDate.now(), LocalDate.now().plusMonths(6),
            new BigDecimal("1000000.00"), ProjectStatus.ACTIVE, pmUser1, adminUser
        ));

        // Project 2 assigned to pmUser2
        projectRepository.save(new Project(
            null, "PRJ-PM2", "PM2 Project", "Description",
            ProjectType.ROAD_INFRASTRUCTURE, "Client", "Zone 2", "State", "District",
            "600002", LocalDate.now(), LocalDate.now().plusMonths(6),
            new BigDecimal("2000000.00"), ProjectStatus.ACTIVE, pmUser2, adminUser
        ));

        mockMvc.perform(get("/api/v1/projects")
                .header("Authorization", "Bearer " + pmToken1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalElements", is(1)))
            .andExpect(jsonPath("$.data.content[0].projectCode", is("PRJ-PM1")));
    }

    @Test
    @DisplayName("Vendor cannot access unrelated project details (403 Forbidden)")
    void getProjectDetails_Vendor_Unrelated_Forbidden() throws Exception {
        Project project = projectRepository.save(new Project(
            null, "PRJ-SECRET", "Secret Infrastructure", "Description",
            ProjectType.UTILITY, "Gov", "Capital", "State", "District",
            "110001", LocalDate.now(), LocalDate.now().plusMonths(12),
            new BigDecimal("50000000.00"), ProjectStatus.ACTIVE, pmUser1, adminUser
        ));

        mockMvc.perform(get("/api/v1/projects/" + project.getId())
                .header("Authorization", "Bearer " + vendorToken))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Invalid project status transition is rejected")
    void updateProjectStatus_InvalidTransition_Rejected() throws Exception {
        Project project = projectRepository.save(new Project(
            null, "PRJ-TERM", "Completed Project", "Description",
            ProjectType.UTILITY, "Gov", "Capital", "State", "District",
            "110001", LocalDate.now().minusMonths(6), LocalDate.now().minusMonths(1),
            new BigDecimal("500000.00"), ProjectStatus.COMPLETED, pmUser1, adminUser
        ));

        UpdateProjectStatusRequest req = new UpdateProjectStatusRequest(ProjectStatus.PLANNED, "Attempt reopen");

        mockMvc.perform(patch("/api/v1/projects/" + project.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message", containsString("Invalid status transition")));
    }

    @Test
    @DisplayName("Project update records audit events")
    void updateProject_RecordsAudit() throws Exception {
        Project project = projectRepository.save(new Project(
            null, "PRJ-UPD", "Original Name", "Description",
            ProjectType.ROAD_INFRASTRUCTURE, "Client", "Region", "State", "District",
            "560001", LocalDate.now(), LocalDate.now().plusMonths(6),
            new BigDecimal("1000000.00"), ProjectStatus.PLANNED, pmUser1, adminUser
        ));

        UpdateProjectRequest req = new UpdateProjectRequest();
        req.setProjectName("Updated Project Name");
        req.setDescription("Updated Description");
        req.setProjectType(ProjectType.ROAD_INFRASTRUCTURE);
        req.setClientName("Updated Client");
        req.setRegion("Region");
        req.setState("State");
        req.setDistrict("District");
        req.setPrimaryPincode("560001");
        req.setStartDate(LocalDate.now());
        req.setTargetEndDate(LocalDate.now().plusMonths(8));
        req.setBudget(new BigDecimal("1500000.00"));

        mockMvc.perform(put("/api/v1/projects/" + project.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.projectName", is("Updated Project Name")));

        // Verify audit event was logged
        mockMvc.perform(get("/api/v1/projects/" + project.getId())
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.auditTrail", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.data.auditTrail[0].eventType", is("PROJECT_UPDATED")));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        pmAssignmentRepository.deleteAll();
        projectRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();
    }
}
