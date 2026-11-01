package com.infrapulse.modules.workdependency;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.dto.CreateWorkAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.UpdateAssignmentStatusRequest;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workdependency.dto.AssignmentValidationRequest;
import com.infrapulse.modules.workdependency.dto.CreateDependencyRequest;
import com.infrapulse.modules.workdependency.dto.PrerequisiteReleaseRequest;
import com.infrapulse.modules.workdependency.dto.UpdateDependencyRequest;
import com.infrapulse.modules.workdependency.entity.WorkTypeDependency;
import com.infrapulse.modules.workdependency.repository.WorkTypeDependencyRepository;
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
import java.util.*;
import java.util.concurrent.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkDependencyEngineTest {

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
    private WorkZoneRepository workZoneRepository;

    @Autowired
    private WorkAssignmentRepository workAssignmentRepository;

    @Autowired
    private WorkTypeDependencyRepository dependencyRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User adminUser;
    private User pmUser1;
    private User pmUser2;
    private User fieldEngineerUser;
    private User vendorUser1;
    private User vendorUser2;

    private String adminToken;
    private String pmToken1;
    private String pmToken2;
    private String feToken;
    private String vendorToken1;
    private String vendorToken2;

    private Project project1;
    private Project project2;
    private WorkZone zone1Project1;
    private WorkZone zone2Project1;
    private WorkZone zone1Project2;
    private Vendor vendor1;
    private Vendor vendor2;

    @BeforeEach
    void setUp() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        userRepository.deleteAll();
        auditEventRepository.deleteAll();
        dependencyRepository.deleteAll();

        // Seed 4 standard baseline dependency rules
        dependencyRepository.save(new WorkTypeDependency(
            UUID.randomUUID().toString(), null, WorkType.TRENCHING, WorkType.UNDERGROUND_CABLE_INSTALLATION,
            AssignmentStatus.COMPLETED, true, true, 1, "Trenching must be completed and released"
        ));
        dependencyRepository.save(new WorkTypeDependency(
            UUID.randomUUID().toString(), null, WorkType.UNDERGROUND_CABLE_INSTALLATION, WorkType.BACKFILLING,
            AssignmentStatus.COMPLETED, true, true, 2, "Cable installation must be completed and released"
        ));
        dependencyRepository.save(new WorkTypeDependency(
            UUID.randomUUID().toString(), null, WorkType.BACKFILLING, WorkType.ROAD_RESURFACING,
            AssignmentStatus.COMPLETED, true, true, 3, "Backfilling must be completed and released"
        ));
        dependencyRepository.save(new WorkTypeDependency(
            UUID.randomUUID().toString(), null, WorkType.ROAD_RESURFACING, WorkType.FINAL_INSPECTION,
            AssignmentStatus.COMPLETED, true, true, 4, "Road resurfacing must be completed and released"
        ));

        // 1. Users
        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Admin Dep",
            "admin.dep@infrapulse.ai",
            passwordEncoder.encode("Password@123"),
            "+91 9999999991",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));

        pmUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "PM One Dep",
            "pm1.dep@infrapulse.ai",
            passwordEncoder.encode("Password@123"),
            "+91 9999999992",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));

        pmUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "PM Two Dep",
            "pm2.dep@infrapulse.ai",
            passwordEncoder.encode("Password@123"),
            "+91 9999999993",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));

        fieldEngineerUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "FE Dep",
            "fe.dep@infrapulse.ai",
            passwordEncoder.encode("Password@123"),
            "+91 9999999994",
            UserRole.FIELD_ENGINEER,
            UserStatus.ACTIVE
        ));

        vendorUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor One User",
            "vendor1.dep@infrapulse.ai",
            passwordEncoder.encode("Password@123"),
            "+91 9999999995",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        vendorUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Vendor Two User",
            "vendor2.dep@infrapulse.ai",
            passwordEncoder.encode("Password@123"),
            "+91 9999999996",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));

        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);
        pmToken1 = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser1);
        pmToken2 = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser2);
        feToken = "Bearer " + jwtTokenProvider.generateAccessToken(fieldEngineerUser);
        vendorToken1 = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser1);
        vendorToken2 = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser2);

        // 2. Vendors with service capabilities
        vendor1 = vendorRepository.save(new Vendor(
            null,
            "VND-DEP-001",
            "Apex Excavations & Trenching",
            "Rajesh Nair",
            "contact@apex.com",
            "+919876543201",
            null,
            "123 Construction St",
            "Chennai",
            "Chennai",
            "Tamil Nadu",
            "600040",
            "33AAAAA0000A1Z5",
            "REG-AP-2024",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.TRENCHING, ServiceCategory.BACKFILLING, ServiceCategory.UNDERGROUND_CABLE_INSTALLATION),
            vendorUser1,
            adminUser
        ));

        vendor2 = vendorRepository.save(new Vendor(
            null,
            "VND-DEP-002",
            "Premier Resurfacing & Paving",
            "Sunil Verma",
            "contact@premier.com",
            "+919876543202",
            null,
            "456 Asphalt Ave",
            "Chennai",
            "Chennai",
            "Tamil Nadu",
            "600040",
            "33BBBBB0000B1Z6",
            "REG-PR-2024",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.ROAD_RESURFACING, ServiceCategory.FINAL_INSPECTION, ServiceCategory.BACKFILLING),
            vendorUser2,
            adminUser
        ));

        // 3. Projects
        project1 = projectRepository.save(new Project(
            null,
            "PRJ-DEP-001",
            "Metro Underground Fiber Corridor",
            "Broadband fiber expansion project",
            ProjectType.FIBER_OPTIC,
            "Metro Telecom Corp",
            "Chennai North",
            "Tamil Nadu",
            "Chennai",
            "600040",
            LocalDate.now().minusDays(30),
            LocalDate.now().plusDays(90),
            new BigDecimal("15000000.00"),
            ProjectStatus.ACTIVE,
            pmUser1,
            adminUser
        ));

        project2 = projectRepository.save(new Project(
            null,
            "PRJ-DEP-002",
            "Secondary Power Grid Network",
            "Secondary project in different district",
            ProjectType.ELECTRICAL,
            "State Power Corp",
            "Chennai South",
            "Tamil Nadu",
            "Chennai",
            "600040",
            LocalDate.now().minusDays(10),
            LocalDate.now().plusDays(120),
            new BigDecimal("8000000.00"),
            ProjectStatus.ACTIVE,
            pmUser2,
            adminUser
        ));

        // 4. Associate vendors
        projectVendorRepository.save(new ProjectVendor(project1, vendor1, adminUser, "Allocated 60%"));
        projectVendorRepository.save(new ProjectVendor(project1, vendor2, adminUser, "Allocated 40%"));
        projectVendorRepository.save(new ProjectVendor(project2, vendor1, adminUser, "Allocated 100%"));

        // 5. Work Zones in PIN 600040 (Anna Nagar)
        zone1Project1 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(),
            "ZON-600040-001",
            project1,
            "Anna Nagar North Sector 1",
            "Primary excavation zone for main corridor",
            "600040",
            "Anna Nagar North",
            "Chennai",
            "Tamil Nadu",
            new BigDecimal("13.0850"),
            new BigDecimal("80.2100"),
            ZoneStatus.AVAILABLE,
            adminUser
        ));

        zone2Project1 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(),
            "ZON-600040-002",
            project1,
            "Anna Nagar East Sector 2",
            "Secondary branch zone",
            "600040",
            "Anna Nagar East",
            "Chennai",
            "Tamil Nadu",
            new BigDecimal("13.0870"),
            new BigDecimal("80.2150"),
            ZoneStatus.AVAILABLE,
            adminUser
        ));

        zone1Project2 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(),
            "ZON-600040-003",
            project2,
            "Anna Nagar South (Project 2)",
            "Work zone belonging to project 2",
            "600040",
            "Anna Nagar South",
            "Chennai",
            "Tamil Nadu",
            new BigDecimal("13.0820"),
            new BigDecimal("80.2080"),
            ZoneStatus.AVAILABLE,
            adminUser
        ));
    }

    // =========================================================================
    // HACKATHON CORE DEMONSTRATION WORKFLOW (Scenarios A -> B -> C -> D)
    // =========================================================================

    @Test
    @DisplayName("Scenario A -> B: Assign Trenching, then attempt Road Resurfacing without prerequisite release -> Backend rejects with DEPENDENCY_NOT_SATISFIED")
    void testScenarioAandB_AttemptRoadResurfacingBeforePrerequisiteRelease() throws Exception {
        // Scenario A: Assign Trenching in zone1Project1 (PIN 600040)
        CreateWorkAssignmentRequest trenchingReq = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor1.getId(),
            WorkType.TRENCHING,
            "Trenching Sector 1 Corridor",
            "Initial earth excavation and trench preparation for optical ducting",
            LocalDate.now(),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            "Safety barricades required."
        );

        String trenchingResponseStr = mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(trenchingReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.workType").value("TRENCHING"))
            .andExpect(jsonPath("$.data.assignmentCode").value(matchesPattern("INF-WA-.*")))
            .andExpect(jsonPath("$.data.releaseStatus").value("PENDING_RELEASE"))
            .andReturn().getResponse().getContentAsString();

        String trenchingId = objectMapper.readTree(trenchingResponseStr).path("data").path("id").asText();
        String trenchingCode = objectMapper.readTree(trenchingResponseStr).path("data").path("assignmentCode").asText();

        // Scenario B: Attempt Road Resurfacing in the EXACT SAME work zone before Trenching is completed and released
        CreateWorkAssignmentRequest resurfacingReq = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor2.getId(),
            WorkType.ROAD_RESURFACING,
            "Road Resurfacing Sector 1",
            "Asphalt paving and surface restoration",
            LocalDate.now().plusDays(11),
            LocalDate.now().plusDays(20),
            AssignmentPriority.HIGH,
            "Coordinate traffic diversion."
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resurfacingReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.code").value("DEPENDENCY_NOT_SATISFIED"))
            .andExpect(jsonPath("$.message").value(containsString("cannot be assigned because prerequisite work has not been released")))
            .andExpect(jsonPath("$.blockedDependencies", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.blockedDependencies[*].workZoneName").value(hasItem("Anna Nagar North Sector 1")));
    }

    @Test
    @DisplayName("Scenario C: Prerequisite Release Workflow - Vendor cannot self-release, PM/FE releases with mandatory review notes")
    void testScenarioC_PrerequisiteReleaseWorkflow() throws Exception {
        // Create Trenching assignment
        WorkAssignment trenching = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000101", project1, zone1Project1, vendor1,
            WorkType.TRENCHING, "Trenching", "Description", LocalDate.now(), LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH, AssignmentStatus.IN_PROGRESS, "Instructions", adminUser
        );
        trenching.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        trenching = workAssignmentRepository.save(trenching);

        // 1. Vendor attempts to self-approve / release work -> FORBIDDEN
        PrerequisiteReleaseRequest releaseReq = new PrerequisiteReleaseRequest(
            ReleaseStatus.RELEASED,
            "Vendor self-approval note"
        );

        mockMvc.perform(post("/api/v1/work-assignments/" + trenching.getId() + "/release")
                .header("Authorization", vendorToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(releaseReq)))
            .andExpect(status().isForbidden());

        // 2. Project Manager outside project scope attempts to release work -> FORBIDDEN (IDOR prevention)
        mockMvc.perform(post("/api/v1/work-assignments/" + trenching.getId() + "/release")
                .header("Authorization", pmToken2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(releaseReq)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(containsString("not the assigned Project Manager")));

        // 3. Rejection decision without mandatory notes -> BAD REQUEST
        PrerequisiteReleaseRequest emptyNotesReq = new PrerequisiteReleaseRequest(
            ReleaseStatus.RELEASED,
            "   "
        );
        mockMvc.perform(post("/api/v1/work-assignments/" + trenching.getId() + "/release")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyNotesReq)))
            .andExpect(status().isBadRequest());

        // 4. Authorized Field Engineer releases prerequisite work with mandatory review note -> SUCCESS
        PrerequisiteReleaseRequest validRelease = new PrerequisiteReleaseRequest(
            ReleaseStatus.RELEASED,
            "Site trench depth verified to 1.5m standard. Clearance authorized for subsequent duct installation."
        );

        mockMvc.perform(post("/api/v1/work-assignments/" + trenching.getId() + "/release")
                .header("Authorization", feToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRelease)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.releaseStatus").value("RELEASED"))
            .andExpect(jsonPath("$.data.status").value("COMPLETED"))
            .andExpect(jsonPath("$.data.releasedBy.fullName").value("FE Dep"))
            .andExpect(jsonPath("$.data.releaseNotes").value(containsString("Site trench depth verified")));

        // Verify audit event persisted
        assertTrue(auditEventRepository.findAll().stream()
            .anyMatch(ae -> "PREREQUISITE_RELEASE_APPROVED".equals(ae.getEventType())));
    }

    @Test
    @DisplayName("Scenario D: End-to-end full dependency progression allows Road Resurfacing once all prerequisites are completed and released")
    void testScenarioD_CompleteFullSequenceAndAllocateRoadResurfacing() throws Exception {
        // Step 1: Complete and release TRENCHING
        WorkAssignment trenching = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000201", project1, zone1Project1, vendor1,
            WorkType.TRENCHING, "Trenching", "Desc", LocalDate.now().minusDays(15), LocalDate.now().minusDays(11),
            AssignmentPriority.HIGH, AssignmentStatus.COMPLETED, "Instructions", adminUser
        );
        trenching.setReleaseStatus(ReleaseStatus.RELEASED);
        trenching.setReleasedBy(pmUser1);
        workAssignmentRepository.save(trenching);

        // Step 2: Complete and release UNDERGROUND_CABLE_INSTALLATION
        WorkAssignment cable = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000202", project1, zone1Project1, vendor1,
            WorkType.UNDERGROUND_CABLE_INSTALLATION, "Cable Laying", "Desc", LocalDate.now().minusDays(10), LocalDate.now().minusDays(6),
            AssignmentPriority.HIGH, AssignmentStatus.COMPLETED, "Instructions", adminUser
        );
        cable.setReleaseStatus(ReleaseStatus.RELEASED);
        cable.setReleasedBy(pmUser1);
        workAssignmentRepository.save(cable);

        // Step 3: Complete and release BACKFILLING
        WorkAssignment backfilling = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000203", project1, zone1Project1, vendor1,
            WorkType.BACKFILLING, "Backfilling", "Desc", LocalDate.now().minusDays(5), LocalDate.now().minusDays(1),
            AssignmentPriority.HIGH, AssignmentStatus.COMPLETED, "Instructions", adminUser
        );
        backfilling.setReleaseStatus(ReleaseStatus.RELEASED);
        backfilling.setReleasedBy(pmUser1);
        workAssignmentRepository.save(backfilling);

        // Step 4: Now allocate ROAD_RESURFACING in the same work zone -> MUST SUCCEED
        CreateWorkAssignmentRequest resurfacingReq = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor2.getId(),
            WorkType.ROAD_RESURFACING,
            "Road Resurfacing Sector 1 Final",
            "Final asphalt restoration after all trenches backfilled and released",
            LocalDate.now(),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            "Apply hot-mix asphalt."
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resurfacingReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.workType").value("ROAD_RESURFACING"))
            .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
            .andExpect(jsonPath("$.data.releaseStatus").value("PENDING_RELEASE"));
    }

    @Test
    @DisplayName("Exclusive Spatial Zone Locking: Rejects concurrent assignment in exclusive work zone while an active assignment exists")
    void testExclusiveSpatialZoneLockingRejection() throws Exception {
        // Clear dependency rules to isolate spatial locking from DAG prerequisites
        dependencyRepository.deleteAll();

        // Enable exclusive locking on zone2Project1
        zone2Project1.setExclusiveLockEnabled(true);
        workZoneRepository.save(zone2Project1);

        // Create an active assignment in zone2Project1
        WorkAssignment activeAssignment = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000999", project1, zone2Project1, vendor1,
            WorkType.TRENCHING, "Active Trenching", "Desc", LocalDate.now(), LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH, AssignmentStatus.IN_PROGRESS, "Instructions", adminUser
        );
        workAssignmentRepository.save(activeAssignment);

        // Attempt another assignment in the same exclusive locked zone with different work type
        CreateWorkAssignmentRequest secondReq = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone2Project1.getId(),
            vendor1.getId(),
            WorkType.UNDERGROUND_CABLE_INSTALLATION,
            "Parallel Work Attempt",
            "Should be blocked by exclusive spatial locking",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.MEDIUM,
            "None"
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondReq)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("SCHEDULING_CONFLICT"))
            .andExpect(jsonPath("$.schedulingConflicts[0].conflictType").value("EXCLUSIVE_ZONE_LOCK_VIOLATION"))
            .andExpect(jsonPath("$.message").value(containsString("scheduling or activity conflicts")));
    }

    // =========================================================================
    // SCOPE AND ISOLATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Work Zone Isolation: Completed Trenching in Zone 2 must NOT satisfy Road Resurfacing in Zone 1")
    void testWorkZoneIsolation() throws Exception {
        // Complete and release Trenching in Zone 2
        WorkAssignment trenchingZone2 = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000301", project1, zone2Project1, vendor1,
            WorkType.TRENCHING, "Trenching Zone 2", "Desc", LocalDate.now().minusDays(10), LocalDate.now().minusDays(5),
            AssignmentPriority.HIGH, AssignmentStatus.COMPLETED, "Instructions", adminUser
        );
        trenchingZone2.setReleaseStatus(ReleaseStatus.RELEASED);
        workAssignmentRepository.save(trenchingZone2);

        // Attempt Road Resurfacing in Zone 1 where prerequisite was never completed
        CreateWorkAssignmentRequest reqZone1 = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor2.getId(),
            WorkType.ROAD_RESURFACING,
            "Road Resurfacing Zone 1",
            "Should be blocked because Zone 1 has no released prerequisite",
            LocalDate.now(),
            LocalDate.now().plusDays(5),
            AssignmentPriority.MEDIUM,
            "None"
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqZone1)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("DEPENDENCY_NOT_SATISFIED"))
            .andExpect(jsonPath("$.blockedDependencies", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Project Isolation: Completed work in Project 2 must NOT satisfy dependencies in Project 1")
    void testProjectIsolation() throws Exception {
        // Complete and release Trenching in Project 2
        WorkAssignment trenchingProj2 = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000401", project2, zone1Project2, vendor1,
            WorkType.TRENCHING, "Trenching Proj 2", "Desc", LocalDate.now().minusDays(10), LocalDate.now().minusDays(5),
            AssignmentPriority.HIGH, AssignmentStatus.COMPLETED, "Instructions", adminUser
        );
        trenchingProj2.setReleaseStatus(ReleaseStatus.RELEASED);
        workAssignmentRepository.save(trenchingProj2);

        // Attempt Cable Installation in Project 1 Zone 1 -> BLOCKED
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor1.getId(),
            WorkType.UNDERGROUND_CABLE_INSTALLATION,
            "Cable in Project 1",
            "Desc",
            LocalDate.now(),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            "None"
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("DEPENDENCY_NOT_SATISFIED"));
    }

    // =========================================================================
    // CONFLICT DETECTION TESTS
    // =========================================================================

    @Test
    @DisplayName("Duplicate Assignment: Cannot create second active Trenching assignment in the same work zone")
    void testDuplicateAssignmentRejected() throws Exception {
        // Create active Trenching assignment
        workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000501", project1, zone1Project1, vendor1,
            WorkType.TRENCHING, "Trenching Active", "Desc", LocalDate.now(), LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH, AssignmentStatus.IN_PROGRESS, "Instructions", adminUser
        ));

        // Attempt second Trenching assignment in same zone
        CreateWorkAssignmentRequest secondTrenching = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor1.getId(),
            WorkType.TRENCHING,
            "Duplicate Trenching",
            "Duplicate attempt",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(12),
            AssignmentPriority.MEDIUM,
            "None"
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondTrenching)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("SCHEDULING_CONFLICT"))
            .andExpect(jsonPath("$.schedulingConflicts[0].conflictType").value("DUPLICATE_ACTIVITY"));
    }

    @Test
    @DisplayName("Cancelled assignments do not cause false scheduling conflicts")
    void testCancelledAssignmentsDoNotCauseConflicts() throws Exception {
        // Create cancelled assignment
        WorkAssignment cancelled = new WorkAssignment(
            UUID.randomUUID().toString(), "INF-WA-2026-000601", project1, zone1Project1, vendor1,
            WorkType.TRENCHING, "Cancelled Trenching", "Desc", LocalDate.now(), LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH, AssignmentStatus.CANCELLED, "Instructions", adminUser
        );
        workAssignmentRepository.save(cancelled);

        // Attempt new Trenching assignment in same zone -> Must be permitted
        CreateWorkAssignmentRequest newTrenching = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1Project1.getId(),
            vendor1.getId(),
            WorkType.TRENCHING,
            "New Trenching",
            "Permitted because previous was cancelled",
            LocalDate.now(),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            "None"
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newTrenching)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // LIVE VALIDATION API ENDPOINT TESTS
    // =========================================================================

    @Test
    @DisplayName("Pre-submission validation API returns structured eligibility and blocker details")
    void testPreSubmissionValidationEndpoint() throws Exception {
        AssignmentValidationRequest req = new AssignmentValidationRequest(
            project1.getId(),
            zone1Project1.getId(),
            WorkType.ROAD_RESURFACING,
            vendor2.getId(),
            LocalDate.now(),
            LocalDate.now().plusDays(10)
        );

        mockMvc.perform(post("/api/v1/work-assignments/validate")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.eligible").value(false))
            .andExpect(jsonPath("$.data.code").value("BLOCKED"))
            .andExpect(jsonPath("$.data.blockedDependencies", hasSize(greaterThanOrEqualTo(1))));
    }

    // =========================================================================
    // DEPENDENCY RULE MANAGEMENT API TESTS
    // =========================================================================

    @Test
    @DisplayName("Admin can create, update, query and toggle dependency rules; non-admin is forbidden")
    void testDependencyRuleManagementApis() throws Exception {
        // Query initial seeded rules
        mockMvc.perform(get("/api/v1/work-dependencies")
                .header("Authorization", adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(4))));

        // Non-admin attempting to create a rule -> FORBIDDEN
        CreateDependencyRequest newRule = new CreateDependencyRequest(
            null,
            WorkType.TRENCHING,
            WorkType.FINAL_INSPECTION,
            AssignmentStatus.COMPLETED,
            true,
            true,
            10,
            "Custom safety inspection rule"
        );

        mockMvc.perform(post("/api/v1/work-dependencies")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRule)))
            .andExpect(status().isForbidden());

        // Admin creates the custom rule -> SUCCESS
        String createdStr = mockMvc.perform(post("/api/v1/work-dependencies")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRule)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.predecessorWorkType").value("TRENCHING"))
            .andExpect(jsonPath("$.data.successorWorkType").value("FINAL_INSPECTION"))
            .andReturn().getResponse().getContentAsString();

        String ruleId = objectMapper.readTree(createdStr).path("data").path("id").asText();

        // Admin toggles status to inactive
        mockMvc.perform(patch("/api/v1/work-dependencies/" + ruleId + "/status")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("isActive", false))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.isActive").value(false));
    }

    // =========================================================================
    // CONCURRENCY & TRANSACTION SAFETY TESTS
    // =========================================================================

    @Test
    @DisplayName("Concurrency: Simultaneous duplicate allocation attempts serialize and cannot both succeed")
    void testConcurrentAssignmentCreationProtection() throws Exception {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threads);

        List<Integer> statuses = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threads; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
                        project1.getId(),
                        zone1Project1.getId(),
                        vendor1.getId(),
                        WorkType.TRENCHING,
                        "Concurrent Trenching " + index,
                        "Concurrency test",
                        LocalDate.now(),
                        LocalDate.now().plusDays(7),
                        AssignmentPriority.HIGH,
                        "None"
                    );

                    int statusCode = mockMvc.perform(post("/api/v1/work-assignments")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                        .andReturn().getResponse().getStatus();

                    statuses.add(statusCode);
                } catch (Exception e) {
                    statuses.add(500);
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Trigger simultaneous execution
        startLatch.countDown();
        finishLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one should succeed with 201 Created; the other must fail with 400 (DUPLICATE_ACTIVITY)
        long createdCount = statuses.stream().filter(s -> s == 201).count();
        long rejectedCount = statuses.stream().filter(s -> s == 400).count();

        assertEquals(1, createdCount, "Exactly one concurrent assignment creation should succeed");
        assertEquals(1, rejectedCount, "Conflicting concurrent assignment must be rejected");
    }
}
