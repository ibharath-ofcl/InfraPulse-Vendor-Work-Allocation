package com.infrapulse.modules.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEvent;
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
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
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
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerTest {

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
    private User vendorUser1;
    private User vendorUser2;
    private User fieldEngineerUser;

    private String adminToken;
    private String pmToken1;
    private String pmToken2;
    private String vendorToken1;
    private String vendorToken2;
    private String fieldEngineerToken;

    private Project project1;
    private Project project2;
    private WorkZone zone1;
    private WorkZone zone2; // Same pincode as zone1 to test distinct zones
    private WorkZone zone3;
    private Vendor vendor1;
    private Vendor vendor2;

    @BeforeEach
    void setUp() {
        workAssignmentRepository.deleteAll();
        dependencyRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(), "Admin Operations", "admin.dash@test.com",
            passwordEncoder.encode("Pass@123"), "+91 99999 00001", UserRole.PLATFORM_ADMIN, UserStatus.ACTIVE
        ));

        pmUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(), "PM North", "pm1.dash@test.com",
            passwordEncoder.encode("Pass@123"), "+91 99999 00002", UserRole.PROJECT_MANAGER, UserStatus.ACTIVE
        ));

        pmUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(), "PM South", "pm2.dash@test.com",
            passwordEncoder.encode("Pass@123"), "+91 99999 00003", UserRole.PROJECT_MANAGER, UserStatus.ACTIVE
        ));

        vendorUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(), "Vendor Alpha", "vnd1.dash@test.com",
            passwordEncoder.encode("Pass@123"), "+91 99999 00004", UserRole.VENDOR, UserStatus.ACTIVE
        ));

        vendorUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(), "Vendor Beta", "vnd2.dash@test.com",
            passwordEncoder.encode("Pass@123"), "+91 99999 00005", UserRole.VENDOR, UserStatus.ACTIVE
        ));

        fieldEngineerUser = userRepository.save(new User(
            UUID.randomUUID().toString(), "Field Inspector", "field.dash@test.com",
            passwordEncoder.encode("Pass@123"), "+91 99999 00006", UserRole.FIELD_ENGINEER, UserStatus.ACTIVE
        ));

        // 2. Tokens
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);
        pmToken1 = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser1);
        pmToken2 = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser2);
        vendorToken1 = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser1);
        vendorToken2 = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser2);
        fieldEngineerToken = "Bearer " + jwtTokenProvider.generateAccessToken(fieldEngineerUser);

        // 3. Projects
        project1 = projectRepository.save(new Project(
            UUID.randomUUID().toString(), "PRJ-CHE-DASH1", "Metro Optical Grid", "Metro optical rollout",
            ProjectType.FIBER_OPTIC, "Chennai Metro Rail", "Chennai Urban", "Tamil Nadu", "Chennai",
            "600001", LocalDate.now(), LocalDate.now().plusMonths(6), new BigDecimal("10000000.00"),
            ProjectStatus.ACTIVE, pmUser1, adminUser
        ));

        project2 = projectRepository.save(new Project(
            UUID.randomUUID().toString(), "PRJ-BLR-DASH2", "Bengaluru Power Ring", "Substation utility modernization",
            ProjectType.UTILITY, "BESCOM", "Bengaluru Central", "Karnataka", "Bengaluru Urban",
            "560001", LocalDate.now(), LocalDate.now().plusMonths(8), new BigDecimal("15000000.00"),
            ProjectStatus.ACTIVE, pmUser2, adminUser
        ));

        // 4. Vendors
        vendor1 = vendorRepository.save(new Vendor(
            UUID.randomUUID().toString(), "VND-ALPHA", "Alpha Trenching Corp", "Alpha Lead",
            "alpha@contractor.example", "+91 98888 11111", null, "Plot 10 Industrial Zone",
            "Chennai", "Chennai", "Tamil Nadu", "600032", "33AAAAA1111A1Z1", "REG-001",
            VendorStatus.ACTIVE, Set.of(ServiceCategory.TRENCHING, ServiceCategory.ROAD_RESURFACING),
            vendorUser1, adminUser
        ));

        vendor2 = vendorRepository.save(new Vendor(
            UUID.randomUUID().toString(), "VND-BETA", "Beta Cabling Systems", "Beta Lead",
            "beta@contractor.example", "+91 98888 22222", null, "Unit 4 Tech Corridor",
            "Bengaluru", "Bengaluru Urban", "Karnataka", "560058", "29BBBBB2222B1Z2", "REG-002",
            VendorStatus.ACTIVE, Set.of(ServiceCategory.UNDERGROUND_CABLE_INSTALLATION, ServiceCategory.BACKFILLING),
            vendorUser2, adminUser
        ));

        // 5. Work Zones (Testing distinct zones with identical PIN code: 600040)
        zone1 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(), "WZ-600040-01", project1, "Anna Nagar Sector 1", "Commercial Zone",
            "600040", "Anna Nagar", "Chennai", "Tamil Nadu", new BigDecimal("13.085000"), new BigDecimal("80.210000"),
            ZoneStatus.ACTIVE, adminUser
        ));

        zone2 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(), "WZ-600040-02", project1, "Anna Nagar Sector 2", "Residential Zone",
            "600040", "Anna Nagar East", "Chennai", "Tamil Nadu", new BigDecimal("13.087000"), new BigDecimal("80.215000"),
            ZoneStatus.AVAILABLE, adminUser
        ));

        zone3 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(), "WZ-560001-01", project2, "MG Road Grid", "Metro ducting",
            "560001", "MG Road", "Bengaluru Urban", "Karnataka", new BigDecimal("12.975000"), new BigDecimal("77.605000"),
            ZoneStatus.AVAILABLE, adminUser
        ));

        // 6. Associations
        projectVendorRepository.save(new ProjectVendor(project1, vendor1, adminUser, "Primary contractor"));
        projectVendorRepository.save(new ProjectVendor(project2, vendor2, adminUser, "Cabling contractor"));

        // 7. Seed Dependency Rules: TRENCHING -> UNDERGROUND_CABLE_INSTALLATION
        dependencyRepository.save(new WorkTypeDependency(
            "dep-dash-01", null, WorkType.TRENCHING, WorkType.UNDERGROUND_CABLE_INSTALLATION,
            AssignmentStatus.COMPLETED, true, true, 1, "Trenching must be completed and released before cabling."
        ));

        // 8. Work Assignments:
        // A1: Completed & Released in Zone 1 (Trenching by Vendor 1)
        WorkAssignment a1 = new WorkAssignment(
            UUID.randomUUID().toString(), "WA-DASH-001", project1, zone1, vendor1, WorkType.TRENCHING,
            "Trenching Zone 1", "Excavation", LocalDate.now(), LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH, AssignmentStatus.COMPLETED, "Instructions", adminUser
        );
        a1.setReleaseStatus(ReleaseStatus.RELEASED);
        workAssignmentRepository.save(a1);

        // A2: In Progress in Zone 1 (Cabling by Vendor 2 - prerequisite satisfied because A1 is completed & released)
        WorkAssignment a2 = new WorkAssignment(
            UUID.randomUUID().toString(), "WA-DASH-002", project1, zone1, vendor2, WorkType.UNDERGROUND_CABLE_INSTALLATION,
            "Cable Laying Zone 1", "Cabling", LocalDate.now().plusDays(6), LocalDate.now().plusDays(10),
            AssignmentPriority.MEDIUM, AssignmentStatus.IN_PROGRESS, "Instructions", adminUser
        );
        a2.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        workAssignmentRepository.save(a2);

        // A3: Submitted for Review in Zone 2 (Trenching by Vendor 1 - awaiting review, NOT completed)
        WorkAssignment a3 = new WorkAssignment(
            UUID.randomUUID().toString(), "WA-DASH-003", project1, zone2, vendor1, WorkType.TRENCHING,
            "Trenching Zone 2", "Excavation completed", LocalDate.now(), LocalDate.now().plusDays(7),
            AssignmentPriority.HIGH, AssignmentStatus.SUBMITTED_FOR_REVIEW, "Instructions", adminUser
        );
        a3.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        workAssignmentRepository.save(a3);

        // A4: Blocked in Zone 2 (Cabling by Vendor 2 - blocked because prerequisite Trenching A3 is only SUBMITTED_FOR_REVIEW, not COMPLETED/RELEASED)
        WorkAssignment a4 = new WorkAssignment(
            UUID.randomUUID().toString(), "WA-DASH-004", project1, zone2, vendor2, WorkType.UNDERGROUND_CABLE_INSTALLATION,
            "Cable Laying Zone 2", "Cabling pending trench", LocalDate.now().plusDays(8), LocalDate.now().plusDays(12),
            AssignmentPriority.MEDIUM, AssignmentStatus.ASSIGNED, "Instructions", adminUser
        );
        a4.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        workAssignmentRepository.save(a4);

        // A5: Cancelled in Project 1 (Should be excluded from progress denominator)
        WorkAssignment a5 = new WorkAssignment(
            UUID.randomUUID().toString(), "WA-DASH-005", project1, zone2, vendor1, WorkType.ROAD_RESURFACING,
            "Abandoned Road Repair", "Cancelled due to design revision", LocalDate.now(), LocalDate.now().plusDays(2),
            AssignmentPriority.LOW, AssignmentStatus.CANCELLED, "Instructions", adminUser
        );
        workAssignmentRepository.save(a5);

        // 9. Audit event
        auditEventRepository.save(new AuditEvent(
            adminUser.getId(), "WORK_ASSIGNMENT_CREATED", "WORK_ASSIGNMENT", a1.getId(),
            "Allocated Trenching to Alpha Trenching Corp in Anna Nagar Sector 1", "Initial operational allocation"
        ));
    }

    @Test
    @DisplayName("Dashboard Summary returns accurate operational metrics and distinguishes completed from submitted work")
    void testSummaryReturnsAccurateMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/summary")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalProjects").value(2))
            .andExpect(jsonPath("$.data.totalAssignments").value(5))
            .andExpect(jsonPath("$.data.completedAssignments").value(1)) // only A1 is COMPLETED
            .andExpect(jsonPath("$.data.awaitingReview").value(1)) // A3 is SUBMITTED_FOR_REVIEW
            .andExpect(jsonPath("$.data.inProgress").value(1)) // A2 is IN_PROGRESS
            .andExpect(jsonPath("$.data.pendingAcceptance").value(1)) // A4 is ASSIGNED
            .andExpect(jsonPath("$.data.activeAssignments").value(2)) // A2 (IN_PROGRESS), A4 (ASSIGNED)
            .andExpect(jsonPath("$.data.dependencyBlocked").value(1)); // A4 is blocked by A3
    }

    @Test
    @DisplayName("Assignment Distribution matches persisted lifecycle states and counts")
    void testAssignmentDistribution() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/assignment-distribution")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.total").value(5))
            .andExpect(jsonPath("$.data.distribution", hasSize(8))) // 8 lifecycle statuses
            .andExpect(jsonPath("$.data.distribution[?(@.status == 'COMPLETED')].count").value(hasItem(1)))
            .andExpect(jsonPath("$.data.distribution[?(@.status == 'SUBMITTED_FOR_REVIEW')].count").value(hasItem(1)))
            .andExpect(jsonPath("$.data.distribution[?(@.status == 'IN_PROGRESS')].count").value(hasItem(1)))
            .andExpect(jsonPath("$.data.distribution[?(@.status == 'CANCELLED')].count").value(hasItem(1)))
            .andExpect(jsonPath("$.data.distribution[?(@.status == 'ASSIGNED')].count").value(hasItem(1)));
    }

    @Test
    @DisplayName("Project Progress excludes cancelled assignments from denominator and calculates percentage correctly")
    void testProjectProgressCalculation() throws Exception {
        // Project 1 has 5 assignments:
        // Total = 5, Cancelled = 1, Eligible = 4
        // Completed = 1 (A1). Progress = 1 / 4 * 100 = 25.0%
        // Project 2 has 0 assignments: Progress = 0.0%
        mockMvc.perform(get("/api/v1/dashboard/project-progress")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.projects", hasSize(2)))
            .andExpect(jsonPath("$.data.projects[?(@.projectCode == 'PRJ-CHE-DASH1')].totalAssignments").value(hasItem(5)))
            .andExpect(jsonPath("$.data.projects[?(@.projectCode == 'PRJ-CHE-DASH1')].completedAssignments").value(hasItem(1)))
            .andExpect(jsonPath("$.data.projects[?(@.projectCode == 'PRJ-CHE-DASH1')].completionPercentage").value(hasItem(25.0)))
            .andExpect(jsonPath("$.data.projects[?(@.projectCode == 'PRJ-BLR-DASH2')].totalAssignments").value(hasItem(0)))
            .andExpect(jsonPath("$.data.projects[?(@.projectCode == 'PRJ-BLR-DASH2')].completionPercentage").value(hasItem(0.0)));
    }

    @Test
    @DisplayName("Work Zone overview keeps distinct zones with identical PIN codes separate")
    void testWorkZoneOverviewDistinctZones() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/work-zones")
                .param("pincode", "600040")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.workZones", hasSize(2))) // Zone 1 and Zone 2 must NOT be merged
            .andExpect(jsonPath("$.data.workZones[?(@.zoneCode == 'WZ-600040-01')].zoneName").value(hasItem("Anna Nagar Sector 1")))
            .andExpect(jsonPath("$.data.workZones[?(@.zoneCode == 'WZ-600040-02')].zoneName").value(hasItem("Anna Nagar Sector 2")));
    }

    @Test
    @DisplayName("Dependency Monitoring identifies blocked assignments and provides Stage 6 prerequisite details")
    void testDependencyMonitoring() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/dependency-monitoring")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalBlocked").value(1))
            .andExpect(jsonPath("$.data.blockedAssignments[0].assignmentCode").value("WA-DASH-004"))
            .andExpect(jsonPath("$.data.blockedAssignments[0].workType").value("UNDERGROUND_CABLE_INSTALLATION"))
            .andExpect(jsonPath("$.data.blockedAssignments[0].requiredPredecessorWorkType").value("TRENCHING"))
            .andExpect(jsonPath("$.data.blockedAssignments[0].predecessorAssignmentCode").value("WA-DASH-003"))
            .andExpect(jsonPath("$.data.blockedAssignments[0].blockingReason", containsString("SUBMITTED_FOR_REVIEW")));
    }

    @Test
    @DisplayName("Vendor isolation: Vendor cannot see other vendors' assignments or workloads")
    void testVendorWorkloadIsolation() throws Exception {
        // Vendor 1 should see only Alpha Trenching Corp
        mockMvc.perform(get("/api/v1/dashboard/vendor-workload")
                .header("Authorization", vendorToken1)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.vendors", hasSize(1)))
            .andExpect(jsonPath("$.data.vendors[0].vendorCode").value("VND-ALPHA"))
            .andExpect(jsonPath("$.data.vendors[0].companyName").value("Alpha Trenching Corp"));

        // Vendor 2 should see only Beta Cabling Systems
        mockMvc.perform(get("/api/v1/dashboard/vendor-workload")
                .header("Authorization", vendorToken2)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.vendors", hasSize(1)))
            .andExpect(jsonPath("$.data.vendors[0].vendorCode").value("VND-BETA"))
            .andExpect(jsonPath("$.data.vendors[0].companyName").value("Beta Cabling Systems"));
    }

    @Test
    @DisplayName("Project Manager cannot see unauthorized projects")
    void testProjectManagerScoping() throws Exception {
        // PM 1 manages Project 1, not Project 2
        mockMvc.perform(get("/api/v1/dashboard/project-progress")
                .header("Authorization", pmToken1)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.projects", hasSize(1)))
            .andExpect(jsonPath("$.data.projects[0].projectCode").value("PRJ-CHE-DASH1"));

        // PM 2 manages Project 2, not Project 1
        mockMvc.perform(get("/api/v1/dashboard/project-progress")
                .header("Authorization", pmToken2)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.projects", hasSize(1)))
            .andExpect(jsonPath("$.data.projects[0].projectCode").value("PRJ-BLR-DASH2"));
    }

    @Test
    @DisplayName("Recent Activity endpoint returns chronological audit events")
    void testRecentActivity() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/recent-activity")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.events", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.data.events[0].eventType").value("WORK_ASSIGNMENT_CREATED"))
            .andExpect(jsonPath("$.data.events[0].assignmentCode").value("WA-DASH-001"));
    }

    @Test
    @DisplayName("Global search finds assignments, work zones, vendors and projects")
    void testGlobalSearch() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/search")
                .param("q", "Alpha")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.results", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.data.results[0].type").value(anyOf(is("VENDOR"), is("ASSIGNMENT"))));
    }

    @Test
    @DisplayName("Dashboard rejects unauthenticated requests")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/summary")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Empty datasets and non-matching filters return safe zero values without errors")
    void testEmptyDatasetHandling() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/summary")
                .param("projectId", "NON_EXISTENT_ID")
                .header("Authorization", adminToken)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalProjects").value(0))
            .andExpect(jsonPath("$.data.totalAssignments").value(0));
    }
}
