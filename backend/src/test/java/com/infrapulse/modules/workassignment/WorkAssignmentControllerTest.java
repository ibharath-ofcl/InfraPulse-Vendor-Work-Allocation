package com.infrapulse.modules.workassignment;

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
import com.infrapulse.modules.workassignment.dto.CancelAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.CreateWorkAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.UpdateAssignmentStatusRequest;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkAssignmentControllerTest {

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

    private String adminToken;
    private String pmToken1;
    private String pmToken2;
    private String vendorToken1;
    private String vendorToken2;

    private Project project1;
    private Project project2;
    private WorkZone zone1;
    private WorkZone zone2;
    private Vendor eligibleVendor;
    private Vendor unassociatedVendor;
    private Vendor wrongCategoryVendor;

    @BeforeEach
    void setUp() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Users
        adminUser = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Platform Administrator",
            "admin@infrapulse.gov.in",
            passwordEncoder.encode("Pass123!"),
            "+91 9999999991",
            UserRole.PLATFORM_ADMIN,
            UserStatus.ACTIVE
        ));
        adminToken = jwtTokenProvider.generateAccessToken(adminUser);

        pmUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "PM Project One",
            "pm1@infrapulse.gov.in",
            passwordEncoder.encode("Pass123!"),
            "+91 9999999992",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));
        pmToken1 = jwtTokenProvider.generateAccessToken(pmUser1);

        pmUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "PM Project Two",
            "pm2@infrapulse.gov.in",
            passwordEncoder.encode("Pass123!"),
            "+91 9999999993",
            UserRole.PROJECT_MANAGER,
            UserStatus.ACTIVE
        ));
        pmToken2 = jwtTokenProvider.generateAccessToken(pmUser2);

        vendorUser1 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "L&T Work Lead",
            "lead@lntinfratech.in",
            passwordEncoder.encode("Pass123!"),
            "+91 9999999994",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));
        vendorToken1 = jwtTokenProvider.generateAccessToken(vendorUser1);

        vendorUser2 = userRepository.save(new User(
            UUID.randomUUID().toString(),
            "Tata Work Lead",
            "lead@tatautilities.in",
            passwordEncoder.encode("Pass123!"),
            "+91 9999999995",
            UserRole.VENDOR,
            UserStatus.ACTIVE
        ));
        vendorToken2 = jwtTokenProvider.generateAccessToken(vendorUser2);

        // 2. Projects
        project1 = projectRepository.save(new Project(
            null,
            "PRJ-WA-001",
            "Chennai Smart Power Corridor",
            "High-voltage cable trenching",
            ProjectType.ELECTRICAL,
            "TANGEDCO",
            "Chennai North",
            "Tamil Nadu",
            "Chennai",
            "600040",
            LocalDate.now().minusDays(5),
            LocalDate.now().plusMonths(8),
            new BigDecimal("50000000.00"),
            ProjectStatus.ACTIVE,
            pmUser1,
            adminUser
        ));

        project2 = projectRepository.save(new Project(
            null,
            "PRJ-WA-002",
            "Bengaluru Metro Fiber Net",
            "Metro fiber network installation",
            ProjectType.FIBER_OPTIC,
            "BMRCL",
            "Bengaluru Central",
            "Karnataka",
            "Bengaluru",
            "560001",
            LocalDate.now().minusDays(10),
            LocalDate.now().plusMonths(6),
            new BigDecimal("30000000.00"),
            ProjectStatus.ACTIVE,
            pmUser2,
            adminUser
        ));

        // 3. Work Zones
        zone1 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(),
            "WZ-600040-001",
            project1,
            "Anna Nagar Sector 1",
            "Trenching zone 1",
            "600040",
            "Anna Nagar",
            "Chennai",
            "Tamil Nadu",
            new BigDecimal("13.085000"),
            new BigDecimal("80.210100"),
            ZoneStatus.AVAILABLE,
            adminUser
        ));

        zone2 = workZoneRepository.save(new WorkZone(
            UUID.randomUUID().toString(),
            "WZ-560001-001",
            project2,
            "MG Road Sector A",
            "Metro fiber sector A",
            "560001",
            "MG Road",
            "Bengaluru",
            "Karnataka",
            new BigDecimal("12.971600"),
            new BigDecimal("77.594600"),
            ZoneStatus.AVAILABLE,
            adminUser
        ));

        // 4. Vendors
        eligibleVendor = vendorRepository.save(new Vendor(
            null,
            "VND-WA-001",
            "L&T Infrastructure Engineering",
            "Rajesh Nair",
            "contact@lntinfratech.in",
            "+919876543210",
            null,
            "Mount Poonamallee Road",
            "Chennai",
            "Chennai",
            "Tamil Nadu",
            "600089",
            "33AAAAA0000A1Z5",
            "REG-LT-2024",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.TRENCHING, ServiceCategory.UNDERGROUND_CABLE_INSTALLATION, ServiceCategory.ROAD_RESURFACING),
            vendorUser1,
            adminUser
        ));

        unassociatedVendor = vendorRepository.save(new Vendor(
            null,
            "VND-WA-002",
            "Tata Power & Utilities Ltd",
            "Sunil Verma",
            "contact@tatautilities.in",
            "+919876543211",
            null,
            "Whitefield Main Rd",
            "Bengaluru",
            "Bengaluru",
            "Karnataka",
            "560066",
            "29BBBBB0000B1Z6",
            "REG-TP-2024",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.TRENCHING, ServiceCategory.UNDERGROUND_CABLE_INSTALLATION),
            vendorUser2,
            adminUser
        ));

        wrongCategoryVendor = vendorRepository.save(new Vendor(
            null,
            "VND-WA-003",
            "Green Landscapers Pvt Ltd",
            "Anita Roy",
            "contact@greenland.in",
            "+919876543212",
            null,
            "Koramangala 4th Block",
            "Bengaluru",
            "Bengaluru",
            "Karnataka",
            "560034",
            "29CCCCC0000C1Z7",
            "REG-GL-2024",
            VendorStatus.ACTIVE,
            Set.of(ServiceCategory.OTHER), // Does NOT have TRENCHING!
            null,
            adminUser
        ));

        // Associate eligibleVendor and wrongCategoryVendor with project1
        projectVendorRepository.save(new ProjectVendor(project1, eligibleVendor, adminUser, "Allocated 60%"));
        projectVendorRepository.save(new ProjectVendor(project1, wrongCategoryVendor, adminUser, "Allocated 40%"));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        projectRepository.deleteAll();
        vendorRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Admin creates work assignment successfully")
    void testAdminCreatesAssignmentSuccessfully() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1.getId(),
            eligibleVendor.getId(),
            WorkType.TRENCHING,
            "Trenching for Main Corridor",
            "Excavate 1.5m depth trench along sector 1",
            LocalDate.now().plusDays(2),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            "Strict adherence to municipal depth guidelines."
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.assignmentCode", startsWith("INF-WA-")))
            .andExpect(jsonPath("$.data.status", is("ASSIGNED")))
            .andExpect(jsonPath("$.data.workType", is("TRENCHING")))
            .andExpect(jsonPath("$.data.vendorCode", is("VND-WA-001")));
    }

    @Test
    @DisplayName("Project Manager creates assignment for an assigned project")
    void testPmCreatesAssignmentForAssignedProject() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1.getId(),
            eligibleVendor.getId(),
            WorkType.TRENCHING,
            "Trenching Sector 1",
            "Excavate trench along sector 1",
            LocalDate.now().plusDays(11),
            LocalDate.now().plusDays(18),
            AssignmentPriority.MEDIUM,
            "Safety gear mandatory."
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + pmToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.assignmentCode", startsWith("INF-WA-")));
    }

    @Test
    @DisplayName("PM cannot create assignment for an unrelated project")
    void testPmCannotCreateAssignmentForUnrelatedProject() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1.getId(),
            eligibleVendor.getId(),
            WorkType.TRENCHING,
            "Unauthorized PM assignment",
            "Attempt by PM2",
            LocalDate.now().plusDays(2),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            null
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + pmToken2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Work zone belonging to another project is rejected")
    void testWorkZoneOfAnotherProjectRejected() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone2.getId(), // zone2 belongs to project2!
            eligibleVendor.getId(),
            WorkType.TRENCHING,
            "Mismatched Zone Assignment",
            "Zone does not belong to project",
            LocalDate.now().plusDays(2),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            null
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Unassociated vendor is rejected")
    void testUnassociatedVendorRejected() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1.getId(),
            unassociatedVendor.getId(), // unassociated with project1!
            WorkType.TRENCHING,
            "Unassociated Vendor Assignment",
            "Vendor not in project",
            LocalDate.now().plusDays(2),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            null
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.data.vendorId", notNullValue()));
    }

    @Test
    @DisplayName("Vendor without required service category is rejected")
    void testVendorWithoutServiceCategoryRejected() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1.getId(),
            wrongCategoryVendor.getId(), // Only OTHER category, cannot do TRENCHING!
            WorkType.TRENCHING,
            "Unqualified Vendor Assignment",
            "Vendor lacks TRENCHING service category",
            LocalDate.now().plusDays(2),
            LocalDate.now().plusDays(10),
            AssignmentPriority.HIGH,
            null
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.data.workType", notNullValue()));
    }

    @Test
    @DisplayName("Invalid schedule is rejected (target end date before start date)")
    void testInvalidScheduleRejected() throws Exception {
        CreateWorkAssignmentRequest req = new CreateWorkAssignmentRequest(
            project1.getId(),
            zone1.getId(),
            eligibleVendor.getId(),
            WorkType.TRENCHING,
            "Invalid Date Assignment",
            "End date before start date",
            LocalDate.now().plusDays(10),
            LocalDate.now().plusDays(2), // End date < Start date!
            AssignmentPriority.HIGH,
            null
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.data.targetEndDate", notNullValue()));
    }

    @Test
    @DisplayName("Vendor sees only their own assignments via /api/v1/vendors/me/work-assignments")
    void testVendorVisibilityScoped() throws Exception {
        WorkAssignment asn1 = workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(),
            "INF-WA-2026-000001",
            project1,
            zone1,
            eligibleVendor,
            WorkType.TRENCHING,
            "Vendor 1 Trenching",
            "Desc",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            AssignmentStatus.ASSIGNED,
            "Instructions",
            adminUser
        ));

        WorkAssignment asn2 = workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(),
            "INF-WA-2026-000002",
            project2,
            zone2,
            unassociatedVendor,
            WorkType.UNDERGROUND_CABLE_INSTALLATION,
            "Vendor 2 Assignment",
            "Desc",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.MEDIUM,
            AssignmentStatus.ASSIGNED,
            "Instructions",
            adminUser
        ));

        // Vendor 1 calls me/work-assignments
        mockMvc.perform(get("/api/v1/vendors/me/work-assignments")
                .header("Authorization", "Bearer " + vendorToken1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.content", hasSize(1)))
            .andExpect(jsonPath("$.data.content[0].assignmentCode", is("INF-WA-2026-000001")));

        // Vendor 2 calls me/work-assignments
        mockMvc.perform(get("/api/v1/vendors/me/work-assignments")
                .header("Authorization", "Bearer " + vendorToken2))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.content", hasSize(1)))
            .andExpect(jsonPath("$.data.content[0].assignmentCode", is("INF-WA-2026-000002")));
    }

    @Test
    @DisplayName("Vendor accepts own assignment successfully")
    void testVendorAcceptsOwnAssignment() throws Exception {
        WorkAssignment asn = workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(),
            "INF-WA-2026-000010",
            project1,
            zone1,
            eligibleVendor,
            WorkType.TRENCHING,
            "Vendor Trenching Acceptance",
            "Desc",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            AssignmentStatus.ASSIGNED,
            "Instructions",
            adminUser
        ));

        UpdateAssignmentStatusRequest req = new UpdateAssignmentStatusRequest(
            AssignmentStatus.ACCEPTED,
            "Accepted team mobilization initiated"
        );

        mockMvc.perform(patch("/api/v1/work-assignments/" + asn.getId() + "/status")
                .header("Authorization", "Bearer " + vendorToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.status", is("ACCEPTED")));
    }

    @Test
    @DisplayName("Vendor cannot accept another vendor's assignment")
    void testVendorCannotAcceptAnotherVendorsAssignment() throws Exception {
        WorkAssignment asn = workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(),
            "INF-WA-2026-000011",
            project1,
            zone1,
            eligibleVendor, // belongs to vendor 1!
            WorkType.TRENCHING,
            "Vendor 1 Trenching",
            "Desc",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            AssignmentStatus.ASSIGNED,
            "Instructions",
            adminUser
        ));

        UpdateAssignmentStatusRequest req = new UpdateAssignmentStatusRequest(
            AssignmentStatus.ACCEPTED,
            "Vendor 2 trying to hijack"
        );

        // Vendor 2 tries to accept Vendor 1's assignment
        mockMvc.perform(patch("/api/v1/work-assignments/" + asn.getId() + "/status")
                .header("Authorization", "Bearer " + vendorToken2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Vendor cannot start an unaccepted assignment")
    void testVendorCannotStartUnacceptedAssignment() throws Exception {
        WorkAssignment asn = workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(),
            "INF-WA-2026-000012",
            project1,
            zone1,
            eligibleVendor,
            WorkType.TRENCHING,
            "Unaccepted Assignment",
            "Desc",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            AssignmentStatus.ASSIGNED, // In ASSIGNED status, cannot go straight to IN_PROGRESS
            "Instructions",
            adminUser
        ));

        UpdateAssignmentStatusRequest req = new UpdateAssignmentStatusRequest(
            AssignmentStatus.IN_PROGRESS,
            "Skipping acceptance to start work"
        );

        mockMvc.perform(patch("/api/v1/work-assignments/" + asn.getId() + "/status")
                .header("Authorization", "Bearer " + vendorToken1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Cancellation requires a reason and updates status to CANCELLED")
    void testCancellationRequiresReason() throws Exception {
        WorkAssignment asn = workAssignmentRepository.save(new WorkAssignment(
            UUID.randomUUID().toString(),
            "INF-WA-2026-000013",
            project1,
            zone1,
            eligibleVendor,
            WorkType.TRENCHING,
            "Assignment to cancel",
            "Desc",
            LocalDate.now().plusDays(1),
            LocalDate.now().plusDays(5),
            AssignmentPriority.HIGH,
            AssignmentStatus.ASSIGNED,
            "Instructions",
            adminUser
        ));

        // Attempt without reason -> fails validation
        CancelAssignmentRequest blankReq = new CancelAssignmentRequest("   ");
        mockMvc.perform(post("/api/v1/work-assignments/" + asn.getId() + "/cancel")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blankReq)))
            .andExpect(status().isBadRequest());

        // With valid reason -> succeeds
        CancelAssignmentRequest validReq = new CancelAssignmentRequest("Project realignment by municipal council.");
        mockMvc.perform(post("/api/v1/work-assignments/" + asn.getId() + "/cancel")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.data.status", is("CANCELLED")))
            .andExpect(jsonPath("$.data.cancellationReason", is("Project realignment by municipal council.")));
    }
}
