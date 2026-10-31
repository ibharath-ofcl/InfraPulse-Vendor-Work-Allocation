package com.infrapulse.modules.workzone;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.workzone.dto.CreateWorkZoneRequest;
import com.infrapulse.modules.workzone.dto.UpdateWorkZoneRequest;
import com.infrapulse.modules.workzone.dto.UpdateZoneStatusRequest;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
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
class WorkZoneControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkZoneRepository workZoneRepository;

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

    private String adminToken;
    private String pmToken1;
    private String pmToken2;
    private String vendorToken;

    private Project activeProject;
    private Project closedProject;

    @BeforeEach
    void setUp() {
        workZoneRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // Admin
        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Admin Officer",
            "admin.zone@infrapulse.gov.in",
            passwordEncoder.encode("Password123!"),
            "+91 9999999991",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));
        adminToken = jwtTokenProvider.generateAccessToken(adminUser);

        // PM 1
        pmUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "PM One",
            "pm1.zone@infrapulse.gov.in",
            passwordEncoder.encode("Password123!"),
            "+91 9999999992",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));
        pmToken1 = jwtTokenProvider.generateAccessToken(pmUser1);

        // PM 2
        pmUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "PM Two",
            "pm2.zone@infrapulse.gov.in",
            passwordEncoder.encode("Password123!"),
            "+91 9999999993",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));
        pmToken2 = jwtTokenProvider.generateAccessToken(pmUser2);

        // Vendor user
        vendorUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor Lead",
            "vendor.zone@contractor.in",
            passwordEncoder.encode("Password123!"),
            "+91 9999999994",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));
        vendorToken = jwtTokenProvider.generateAccessToken(vendorUser);

        // Active project managed by PM 1
        activeProject = projectRepository.save(new Project(
            null,
            "INF-WZ-001",
            "Chennai Smart Water Grid",
            "Water pipeline expansion",
            ProjectType.UTILITY,
            "Chennai Metro Water",
            "Chennai North",
            "Tamil Nadu",
            "Chennai",
            "600040",
            LocalDate.now().minusDays(10),
            LocalDate.now().plusMonths(6),
            new BigDecimal("25000000.00"),
            ProjectStatus.ACTIVE,
            pmUser1,
            adminUser
        ));

        // Completed project
        closedProject = projectRepository.save(new Project(
            null,
            "INF-WZ-002",
            "Completed Road Project",
            "Road resurfacing project completed",
            ProjectType.ROAD_INFRASTRUCTURE,
            "Highways Dept",
            "Chennai South",
            "Tamil Nadu",
            "Chennai",
            "600001",
            LocalDate.now().minusMonths(6),
            LocalDate.now().minusDays(1),
            new BigDecimal("10000000.00"),
            ProjectStatus.COMPLETED,
            pmUser1,
            adminUser
        ));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        workZoneRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Admin creates a work zone successfully")
    void testAdminCreatesWorkZone() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            activeProject.getId(),
            "Anna Nagar Sector A",
            "Infrastructure sector for water pipeline trenching",
            "600040",
            "Anna Nagar West",
            "Chennai",
            "Tamil Nadu",
            new BigDecimal("13.085000"),
            new BigDecimal("80.210100")
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.zoneName", is("Anna Nagar Sector A")))
            .andExpect(jsonPath("$.data.pincode", is("600040")))
            .andExpect(jsonPath("$.data.zoneCode", startsWith("WZ-600040-")))
            .andExpect(jsonPath("$.data.status", is("AVAILABLE")));
    }

    @Test
    @DisplayName("Project Manager creates a zone within assigned project")
    void testPmCreatesZoneInAssignedProject() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            activeProject.getId(),
            "Anna Nagar Sector B",
            "Secondary trenching sector",
            "600040",
            "Anna Nagar Central",
            "Chennai",
            "Tamil Nadu",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.zoneName", is("Anna Nagar Sector B")));
    }

    @Test
    @DisplayName("Project Manager cannot create a zone in an unrelated project")
    void testPmCannotCreateZoneInUnassignedProject() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            activeProject.getId(),
            "Unauthorized Sector",
            "Sector attempt by PM2",
            "600040",
            "Anna Nagar",
            "Chennai",
            "Tamil Nadu",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + pmToken2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Invalid PIN code is rejected")
    void testInvalidPincodeRejected() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            activeProject.getId(),
            "Invalid PIN Zone",
            "Invalid PIN description",
            "60004", // only 5 digits
            "Anna Nagar",
            "Chennai",
            "Tamil Nadu",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Invalid coordinates are rejected")
    void testInvalidCoordinatesRejected() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            activeProject.getId(),
            "Invalid Coordinates Zone",
            "Invalid Lat Long",
            "600040",
            "Anna Nagar",
            "Chennai",
            "Tamil Nadu",
            new BigDecimal("95.0000"), // Lat > 90
            new BigDecimal("80.2101")
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Inactive or Completed project cannot receive a new work zone")
    void testClosedProjectCannotReceiveWorkZone() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            closedProject.getId(),
            "Zone for closed project",
            "Should be rejected",
            "600001",
            "Parrys",
            "Chennai",
            "Tamil Nadu",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Unauthorized users cannot create or update zones")
    void testVendorCannotCreateZone() throws Exception {
        CreateWorkZoneRequest request = new CreateWorkZoneRequest(
            activeProject.getId(),
            "Vendor Zone Attempt",
            "Should fail",
            "600040",
            "Anna Nagar",
            "Chennai",
            "Tamil Nadu",
            null,
            null
        );

        mockMvc.perform(post("/api/v1/work-zones")
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("List work zones filters by PIN code and project")
    void testListWorkZonesFilters() throws Exception {
        WorkZone z1 = new WorkZone(
            UUID.randomUUID().toString(),
            "WZ-600040-001",
            activeProject,
            "Zone 1",
            "Description 1",
            "600040",
            "Locality 1",
            "Chennai",
            "Tamil Nadu",
            null,
            null,
            ZoneStatus.AVAILABLE,
            adminUser
        );
        workZoneRepository.save(z1);

        WorkZone z2 = new WorkZone(
            UUID.randomUUID().toString(),
            "WZ-600040-002",
            activeProject,
            "Zone 2",
            "Description 2",
            "600040",
            "Locality 2",
            "Chennai",
            "Tamil Nadu",
            null,
            null,
            ZoneStatus.AVAILABLE,
            adminUser
        );
        workZoneRepository.save(z2);

        mockMvc.perform(get("/api/v1/work-zones")
                .param("projectId", activeProject.getId())
                .param("pincode", "600040")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.content", hasSize(2)));
    }
}
