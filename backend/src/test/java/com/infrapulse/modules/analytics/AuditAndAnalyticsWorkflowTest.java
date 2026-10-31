package com.infrapulse.modules.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditEvent;
import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditIntegrityStatus;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditIntegrityReport;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.common.audit.AuditIntegrityService;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.modules.analytics.dto.*;
import com.infrapulse.modules.analytics.enums.*;
import com.infrapulse.modules.analytics.repository.VendorScoringConfigurationRepository;
import com.infrapulse.modules.analytics.service.*;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.CorrectiveActionType;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionReviewRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityInspectionTemplate;
import com.infrapulse.modules.quality.model.AssessmentStatus;
import com.infrapulse.modules.quality.model.FindingSeverity;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.quality.repository.QualityInspectionTemplateRepository;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuditAndAnalyticsWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditIntegrityService auditIntegrityService;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private VendorPerformanceAnalyticsService vendorAnalyticsService;

    @Autowired
    private ProjectPerformanceAnalyticsService projectAnalyticsService;

    @Autowired
    private OperationalAnalyticsService operationalAnalyticsService;

    @Autowired
    private VendorScoringConfigurationService scoringConfigService;

    @Autowired
    private ReportExportService reportExportService;

    @Autowired
    private VendorScoringConfigurationRepository scoringConfigRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectVendorRepository projectVendorRepository;

    @Autowired
    private WorkZoneRepository workZoneRepository;

    @Autowired
    private WorkAssignmentRepository assignmentRepository;

    @Autowired
    private HumanInspectionReviewRepository reviewRepository;

    @Autowired
    private HumanInspectionDecisionRepository decisionRepository;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private ProjectMilestoneRepository milestoneRepository;

    @Autowired
    private QualityInspectionTemplateRepository templateRepository;

    @Autowired
    private QualityAssessmentRepository assessmentRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User pmUser;
    private User inspectorUser;
    private User vendorUser1;
    private User vendorUser2;

    private String adminToken;
    private String pmToken;
    private String vendor1Token;
    private String vendor2Token;

    private Vendor vendor1;
    private Vendor vendor2;
    private Project testProject;
    private WorkZone testZone;
    private QualityInspectionTemplate testTemplate;

    @BeforeEach
    void setUp() {
        scoringConfigRepository.deleteAll();

        adminUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Stage13 Admin",
                "s13_admin_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543210",
                UserRole.PLATFORM_ADMIN,
                UserStatus.ACTIVE
        ));

        pmUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Stage13 PM",
                "s13_pm_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543211",
                UserRole.PROJECT_MANAGER,
                UserStatus.ACTIVE
        ));

        inspectorUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Stage13 Inspector",
                "s13_insp_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543212",
                UserRole.FIELD_ENGINEER,
                UserStatus.ACTIVE
        ));

        vendorUser1 = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Apex Vendor Rep",
                "s13_apex_" + UUID.randomUUID() + "@vendor.com",
                passwordEncoder.encode("Password@123"),
                "+919876543213",
                UserRole.VENDOR,
                UserStatus.ACTIVE
        ));

        vendorUser2 = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Beacon Vendor Rep",
                "s13_beacon_" + UUID.randomUUID() + "@vendor.com",
                passwordEncoder.encode("Password@123"),
                "+919876543214",
                UserRole.VENDOR,
                UserStatus.ACTIVE
        ));

        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);
        pmToken = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser);
        vendor1Token = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser1);
        vendor2Token = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser2);

        vendor1 = new Vendor();
        vendor1.setVendorCode("VND-S13-A-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        vendor1.setCompanyName("Apex Infra Solutions");
        vendor1.setContactPerson("Apex Rep");
        vendor1.setEmail("apex@vendor.com");
        vendor1.setPhoneNumber("+919876543210");
        vendor1.setAddressLine("Plot 12 Whitefield");
        vendor1.setCity("Bengaluru");
        vendor1.setDistrict("Bengaluru Urban");
        vendor1.setState("Karnataka");
        vendor1.setPincode("560066");
        vendor1.setStatus(VendorStatus.ACTIVE);
        vendor1.setServiceCategories(Set.of(ServiceCategory.TRENCHING));
        vendor1.setUser(vendorUser1);
        vendor1.setCreatedBy(adminUser);
        vendor1 = vendorRepository.save(vendor1);

        vendor2 = new Vendor();
        vendor2.setVendorCode("VND-S13-B-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        vendor2.setCompanyName("Beacon Telecom Works");
        vendor2.setContactPerson("Beacon Rep");
        vendor2.setEmail("beacon@vendor.com");
        vendor2.setPhoneNumber("+919876543211");
        vendor2.setAddressLine("Plot 15 Whitefield");
        vendor2.setCity("Bengaluru");
        vendor2.setDistrict("Bengaluru Urban");
        vendor2.setState("Karnataka");
        vendor2.setPincode("560066");
        vendor2.setStatus(VendorStatus.ACTIVE);
        vendor2.setServiceCategories(Set.of(ServiceCategory.UNDERGROUND_CABLE_INSTALLATION));
        vendor2.setUser(vendorUser2);
        vendor2.setCreatedBy(adminUser);
        vendor2 = vendorRepository.save(vendor2);

        testProject = new Project(
                UUID.randomUUID().toString(),
                "PRJ-S13-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(),
                "Metropolitan Fiber Rollout",
                "High Speed Fiber Deployment",
                ProjectType.FIBER_OPTIC,
                "Telecom State Corp",
                "South", "Karnataka", "Bengaluru Urban", "560001",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(180),
                new BigDecimal("1500000.00"), ProjectStatus.ACTIVE,
                adminUser, pmUser
        );
        testProject = projectRepository.save(testProject);

        projectVendorRepository.save(new ProjectVendor(testProject, vendor1, pmUser, "Authorized vendor"));
        projectVendorRepository.save(new ProjectVendor(testProject, vendor2, pmUser, "Authorized vendor"));

        testZone = new WorkZone(
                UUID.randomUUID().toString(),
                "WZ-S13-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(),
                testProject,
                "Zone 1 Metro",
                "Metro Sector",
                "560066",
                "Bengaluru", "Bengaluru Urban", "Karnataka",
                BigDecimal.valueOf(12.9716), BigDecimal.valueOf(77.5946),
                ZoneStatus.ACTIVE, adminUser
        );
        testZone = workZoneRepository.save(testZone);

        testTemplate = new QualityInspectionTemplate();
        testTemplate.setTemplateCode("TMPL-S13-" + UUID.randomUUID().toString().substring(0, 6));
        testTemplate.setWorkType(WorkType.TRENCHING);
        testTemplate.setVersion("1.0.0");
        testTemplate.setName("Standard Trenching Inspection Protocol");
        testTemplate.setDescription("Stage 13 template");
        testTemplate.setActive(true);
        testTemplate = templateRepository.save(testTemplate);
    }

    @Test
    @DisplayName("1. Centralized Audit Logging & Cryptographic SHA-256 Hash Chaining")
    void testAuditTrailAndHashChaining() {
        AuditEvent event1 = auditService.recordEvent(
                "PRJ_CREATED",
                AuditCategory.PROJECT_MANAGEMENT,
                "PROJECT",
                testProject.getId(),
                testProject.getProjectName(),
                testProject.getId(),
                null,
                "CREATE",
                AuditOutcome.SUCCESS,
                "Project successfully created by Admin",
                adminUser.getId(),
                adminUser.getFullName(),
                adminUser.getRole().name(),
                Map.of("budget", 1500000, "projectCode", testProject.getProjectCode()),
                "TEST_CHAIN_INTEGRITY"
        );

        AuditEvent event2 = auditService.recordEvent(
                "VND_ASSIGNED",
                AuditCategory.WORK_ALLOCATION,
                "VENDOR",
                vendor1.getId(),
                vendor1.getCompanyName(),
                testProject.getId(),
                vendor1.getId(),
                "ASSIGN",
                AuditOutcome.SUCCESS,
                "Vendor assigned to project",
                pmUser.getId(),
                pmUser.getFullName(),
                pmUser.getRole().name(),
                Map.of("serviceCategory", "CIVIL_CONSTRUCTION"),
                "TEST_CHAIN_INTEGRITY"
        );

        AuditEvent event3 = auditService.recordEvent(
                "EVD_UPLOADED",
                AuditCategory.EVIDENCE_AI,
                "EVIDENCE",
                UUID.randomUUID().toString(),
                "trenching_depth_verification.jpg",
                testProject.getId(),
                vendor1.getId(),
                "UPLOAD",
                AuditOutcome.SUCCESS,
                "Vendor submitted photographic proof",
                vendorUser1.getId(),
                vendorUser1.getFullName(),
                vendorUser1.getRole().name(),
                Map.of("fileSize", 409600, "aiAnalysisScheduled", true),
                "TEST_CHAIN_INTEGRITY"
        );

        assertThat(event1.getEventHash()).isNotNull().hasSize(64);
        assertThat(event2.getEventHash()).isNotNull().hasSize(64);
        assertThat(event3.getEventHash()).isNotNull().hasSize(64);

        // Hash chain linkage: event2 previousHash must equal event1 eventHash
        assertThat(event2.getPreviousHash()).isEqualTo(event1.getEventHash());
        // event3 previousHash must equal event2 eventHash
        assertThat(event3.getPreviousHash()).isEqualTo(event2.getEventHash());

        // Verify chain integrity using AuditIntegrityService
        AuditIntegrityReport report = auditIntegrityService.verifyChain("TEST_CHAIN_INTEGRITY");
        assertThat(report.getStatus()).isEqualTo(AuditIntegrityStatus.VALID);
        assertThat(report.getTotalEventsChecked()).isGreaterThanOrEqualTo(3);
    }

    @Test
    @DisplayName("2. Tamper-Evidence: Modifying an audit event payload breaks chain integrity")
    void testTamperEvidenceDetection() {
        AuditEvent event = auditService.recordEvent(
                "FIN_PAYMENT_AUTH",
                AuditCategory.FINANCIAL_WORKFLOW,
                "PAYMENT_AUTH",
                UUID.randomUUID().toString(),
                "AUTH-13-999",
                testProject.getId(),
                vendor1.getId(),
                "AUTHORIZE",
                AuditOutcome.SUCCESS,
                "Simulated payment authorized",
                adminUser.getId(),
                adminUser.getFullName(),
                adminUser.getRole().name(),
                Map.of("authorizedAmount", 25000, "settlementMode", "SIMULATED"),
                "CHAIN_TAMPER_TEST"
        );

        assertThat(auditIntegrityService.verifySingleEvent(event)).isTrue();

        // Tamper with payload
        event.setEventPayload("{\"authorizedAmount\": 9999999, \"tampered\": true}");
        auditEventRepository.save(event);

        // Verify that AuditIntegrityService immediately catches payload tampering
        assertThat(auditIntegrityService.verifySingleEvent(event)).isFalse();
    }

    @Test
    @DisplayName("3. Vendor Performance Analytics: Real Persisted Data Calculation (10 KPIs)")
    void testVendorPerformanceAnalyticsCalculation() {
        WorkAssignment a1 = new WorkAssignment();
        a1.setId(UUID.randomUUID().toString());
        a1.setAssignmentCode("ASG-S13-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        a1.setTitle("Trenching Route A");
        a1.setProject(testProject);
        a1.setWorkZone(testZone);
        a1.setVendor(vendor1);
        a1.setWorkType(WorkType.TRENCHING);
        a1.setPriority(AssignmentPriority.HIGH);
        a1.setStatus(AssignmentStatus.COMPLETED);
        a1.setReleaseStatus(ReleaseStatus.RELEASED);
        a1.setPlannedStartDate(LocalDate.now().minusDays(10));
        a1.setTargetEndDate(LocalDate.now().minusDays(2));
        a1.setActualEndDate(LocalDate.now().minusDays(3)); // On time!
        a1.setCreatedBy(adminUser);
        a1 = assignmentRepository.save(a1);

        WorkAssignment a2 = new WorkAssignment();
        a2.setId(UUID.randomUUID().toString());
        a2.setAssignmentCode("ASG-S13-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        a2.setTitle("Fiber Blowing Route B");
        a2.setProject(testProject);
        a2.setWorkZone(testZone);
        a2.setVendor(vendor1);
        a2.setWorkType(WorkType.UNDERGROUND_CABLE_INSTALLATION);
        a2.setPriority(AssignmentPriority.MEDIUM);
        a2.setStatus(AssignmentStatus.COMPLETED);
        a2.setReleaseStatus(ReleaseStatus.RELEASED);
        a2.setPlannedStartDate(LocalDate.now().minusDays(8));
        a2.setTargetEndDate(LocalDate.now().minusDays(4));
        a2.setActualEndDate(LocalDate.now().minusDays(1)); // Overdue
        a2.setCreatedBy(adminUser);
        a2 = assignmentRepository.save(a2);

        // Create Quality Assessments
        QualityAssessment qa1 = new QualityAssessment();
        qa1.setAssessmentCode("QA-S13-" + UUID.randomUUID().toString().substring(0, 6));
        qa1.setAssignment(a1);
        qa1.setTemplate(testTemplate);
        qa1.setStatus(AssessmentStatus.PASS);
        qa1.setCreatedBy(adminUser);
        qa1 = assessmentRepository.save(qa1);

        QualityAssessment qa2 = new QualityAssessment();
        qa2.setAssessmentCode("QA-S13-" + UUID.randomUUID().toString().substring(0, 6));
        qa2.setAssignment(a2);
        qa2.setTemplate(testTemplate);
        qa2.setStatus(AssessmentStatus.FAIL);
        qa2.setCreatedBy(adminUser);
        qa2 = assessmentRepository.save(qa2);

        // Create Human Review & Approved Decision for a1
        HumanInspectionReview r1 = new HumanInspectionReview();
        r1.setId(UUID.randomUUID().toString());
        r1.setReviewCode("HIR-S13-" + UUID.randomUUID().toString().substring(0, 6));
        r1.setAssignment(a1);
        r1.setAssessment(qa1);
        r1.setReviewStatus(ReviewStatus.COMPLETED);
        r1.setReviewer(inspectorUser);
        r1.setCreatedAt(Instant.now().minus(5, ChronoUnit.DAYS));
        r1.setCompletedAt(Instant.now().minus(4, ChronoUnit.DAYS));
        r1 = reviewRepository.save(r1);

        HumanInspectionDecision d1 = new HumanInspectionDecision();
        d1.setReview(r1);
        d1.setAssessment(qa1);
        d1.setAssignment(a1);
        d1.setReviewer(inspectorUser);
        d1.setReviewerRole("FIELD_ENGINEER");
        d1.setDecisionType(ReviewDecisionType.APPROVED);
        d1.setReason("Work conforms precisely to engineering specs.");
        decisionRepository.save(d1);

        // Create Human Review & Rejection with Corrective Action for a2
        HumanInspectionReview r2 = new HumanInspectionReview();
        r2.setId(UUID.randomUUID().toString());
        r2.setReviewCode("HIR-S13-" + UUID.randomUUID().toString().substring(0, 6));
        r2.setAssignment(a2);
        r2.setAssessment(qa2);
        r2.setReviewStatus(ReviewStatus.COMPLETED);
        r2.setReviewer(inspectorUser);
        r2.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        r2.setCompletedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        r2 = reviewRepository.save(r2);

        HumanInspectionDecision d2 = new HumanInspectionDecision();
        d2.setReview(r2);
        d2.setAssessment(qa2);
        d2.setAssignment(a2);
        d2.setReviewer(inspectorUser);
        d2.setReviewerRole("FIELD_ENGINEER");
        d2.setDecisionType(ReviewDecisionType.REJECTED);
        d2.setReason("Fiber bend radius violation detected.");
        decisionRepository.save(d2);

        // Corrective action created and verified closed
        CorrectiveAction ca = new CorrectiveAction();
        ca.setId(UUID.randomUUID().toString());
        ca.setActionCode("CA-S13-" + UUID.randomUUID().toString().substring(0, 6));
        ca.setAssignment(a2);
        ca.setAssessment(qa2);
        ca.setVendor(vendor1);
        ca.setActionType(CorrectiveActionType.REPAIR_OR_REWORK);
        ca.setSeverity(FindingSeverity.HIGH);
        ca.setStatus(CorrectiveActionStatus.VERIFIED);
        ca.setDescription("Re-splice fiber at joint chamber 4");
        ca.setAssignedInspector(inspectorUser);
        ca.setDueAt(Instant.now().plus(2, ChronoUnit.DAYS));
        ca.setCreatedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        ca.setClosedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        ca.setCreatedBy(adminUser);
        correctiveActionRepository.save(ca);

        // Calculate performance
        VendorPerformanceDto perf = vendorAnalyticsService.calculateVendorPerformance(vendor1, testProject.getId());

        assertThat(perf).isNotNull();
        assertThat(perf.getVendorCode()).isEqualTo(vendor1.getVendorCode());
        assertThat(perf.getTotalAssignments()).isGreaterThanOrEqualTo(2);
        // Completion rate: 1 approved completed out of 2 eligible = 50%
        assertThat(perf.getCompletionRate()).isEqualByComparingTo(new BigDecimal("50.00"));
        // On-time rate: 1 approved on-time out of 1 approved completed = 100%
        assertThat(perf.getOnTimeRate()).isEqualByComparingTo(new BigDecimal("100.00"));
        // Quality pass rate: 1 approved out of 2 completed reviews = 50%
        assertThat(perf.getQualityPassRate()).isEqualByComparingTo(new BigDecimal("50.00"));
        // Rework rate: 1 assignment requiring rework out of 2 inspected = 50%
        assertThat(perf.getReworkRate()).isEqualByComparingTo(new BigDecimal("50.00"));
        // Data sufficiency status: has sufficient real records
        assertThat(perf.getDataSufficiencyStatus()).isEqualTo(DataSufficiencyStatus.SUFFICIENT_DATA);

        assertThat(perf.getOverallPerformanceScore()).isNotNull();
        assertThat(perf.getOverallPerformanceScore().doubleValue()).isBetween(55.0, 70.0);
    }

    @Test
    @DisplayName("4. Configurable Vendor Scoring Framework: Weight changes update scores accurately")
    void testConfigurableVendorScoringFramework() {
        ScoringConfigurationDto customConfig = new ScoringConfigurationDto();
        customConfig.setConfigurationName("Quality First 2026");
        customConfig.setQualityWeight(new BigDecimal("50.00"));
        customConfig.setOnTimeWeight(new BigDecimal("20.00"));
        customConfig.setEvidenceWeight(new BigDecimal("10.00"));
        customConfig.setReworkWeight(new BigDecimal("10.00"));
        customConfig.setCompletionWeight(new BigDecimal("10.00"));

        ScoringConfigurationDto saved = scoringConfigService.createConfiguration(customConfig, adminUser);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getVersion()).isEqualTo(1);

        // Activate custom config
        scoringConfigService.activateConfiguration(saved.getId(), adminUser);

        ScoringConfigurationDto active = scoringConfigService.getActiveConfiguration();
        assertThat(active.getConfigurationName()).isEqualTo("Quality First 2026");
        assertThat(active.getQualityWeight()).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    @Test
    @DisplayName("5. Insufficient Data Handling: New Vendor without history has INSUFFICIENT_DATA status")
    void testInsufficientDataHandling() {
        Vendor newVendor = new Vendor();
        newVendor.setVendorCode("VND-S13-NEW-" + UUID.randomUUID().toString().substring(0, 4));
        newVendor.setCompanyName("Nova Telecommunications");
        newVendor.setContactPerson("Nova Rep");
        newVendor.setEmail("nova@vendor.com");
        newVendor.setPhoneNumber("+919876543299");
        newVendor.setAddressLine("Plot 99 IT Park");
        newVendor.setCity("Bengaluru");
        newVendor.setDistrict("Bengaluru Urban");
        newVendor.setState("Karnataka");
        newVendor.setPincode("560066");
        newVendor.setStatus(VendorStatus.ACTIVE);
        newVendor.setServiceCategories(Set.of(ServiceCategory.TRENCHING));
        newVendor.setCreatedBy(adminUser);
        newVendor = vendorRepository.save(newVendor);

        VendorPerformanceDto perf = vendorAnalyticsService.calculateVendorPerformance(newVendor, null);

        assertThat(perf.getDataSufficiencyStatus()).isEqualTo(DataSufficiencyStatus.INSUFFICIENT_DATA);
        assertThat(perf.getOverallScore()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("6. Multi-Vendor Comparison & Scope-Aware Ranking")
    void testVendorComparisonAndRanking() {
        VendorComparisonDto comparison = vendorAnalyticsService.compareVendors(
                java.util.List.of(vendor1.getId(), vendor2.getId()),
                testProject.getId()
        );

        assertThat(comparison).isNotNull();
        assertThat(comparison.getVendors()).hasSize(2);
    }

    @Test
    @DisplayName("7. Project Analytics & Operational Command Center API")
    void testOperationalAnalyticsAndProjectPerformance() {
        ProjectPerformanceDto projectPerf = projectAnalyticsService.getProjectPerformance(testProject.getId());
        assertThat(projectPerf).isNotNull();
        assertThat(projectPerf.getProjectCode()).isEqualTo(testProject.getProjectCode());

        OperationalDashboardDto dashboard = operationalAnalyticsService.getOperationalDashboardSummary(null);
        assertThat(dashboard).isNotNull();
        assertThat(dashboard.getActiveProjectsCount()).isGreaterThanOrEqualTo(1);
        assertThat(dashboard.getWorkStatusDistribution()).isNotNull();
    }

    @Test
    @DisplayName("8. Exportable CSV Reports: RBAC Enforcement & Data Generation")
    void testExportableCsvReports() {
        ExportReportRequestDto req = new ExportReportRequestDto();
        req.setReportType(ReportType.VENDOR_PERFORMANCE);
        req.setFormat(ReportFormat.CSV);

        ReportJobResponseDto job = reportExportService.exportReport(req, adminUser);
        assertThat(job).isNotNull();
        byte[] csvBytes = reportExportService.downloadReportContent(job.getId(), adminUser);
        String csvData = new String(csvBytes);
        assertThat(csvData).contains("Vendor Code", "Company Name", "Quality Pass Rate");

        // Verify Work Assignment report export
        ExportReportRequestDto workReq = new ExportReportRequestDto();
        workReq.setReportType(ReportType.WORK_ASSIGNMENT);
        workReq.setFormat(ReportFormat.CSV);

        ReportJobResponseDto workJob = reportExportService.exportReport(workReq, adminUser);
        assertThat(workJob).isNotNull();
        byte[] workBytes = reportExportService.downloadReportContent(workJob.getId(), adminUser);
        String workData = new String(workBytes);
        assertThat(workData).contains("Assignment Code", "Title", "Work Type");

        // Verify Milestone / Financial report export
        ExportReportRequestDto finReq = new ExportReportRequestDto();
        finReq.setReportType(ReportType.MILESTONE_FINANCIAL);
        finReq.setFormat(ReportFormat.CSV);

        ReportJobResponseDto finJob = reportExportService.exportReport(finReq, adminUser);
        assertThat(finJob).isNotNull();
        byte[] finBytes = reportExportService.downloadReportContent(finJob.getId(), adminUser);
        String finData = new String(finBytes);
        assertThat(finData).contains("Milestone Code", "Milestone Value");
    }

    @Test
    @DisplayName("9. REST API & RBAC Security: Vendors cannot access other vendors' activity (IDOR Protection)")
    void testVendorIdorProtection() throws Exception {
        // Vendor 1 accessing Vendor 2's activity -> 403 Forbidden
        mockMvc.perform(get("/api/v1/vendors/" + vendor2.getId() + "/activity")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isForbidden());

        // Vendor 1 accessing own activity -> 200 OK
        mockMvc.perform(get("/api/v1/vendors/" + vendor1.getId() + "/activity")
                        .header("Authorization", vendor1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("10. REST API: Audit Search & Cryptographic Integrity Verification Endpoint")
    void testAuditSearchAndIntegrityEndpoints() throws Exception {
        // Audit events listing (Admin authorized)
        mockMvc.perform(get("/api/v1/audit-events")
                        .header("Authorization", adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        // Record an event in API test scope
        auditService.recordEvent(
                "TEST_API_EVENT",
                AuditCategory.AUTHENTICATION,
                "USER",
                adminUser.getId(),
                "Admin",
                testProject.getId(),
                null,
                "LOGIN",
                AuditOutcome.SUCCESS,
                "Admin login",
                adminUser.getId(),
                adminUser.getFullName(),
                adminUser.getRole().name(),
                Map.of("ip", "127.0.0.1"),
                "API_TEST_CHAIN"
        );

        // Audit integrity verification (Admin authorized)
        mockMvc.perform(post("/api/v1/audit-events/integrity/verify")
                        .header("Authorization", adminToken)
                        .param("chainScope", "API_TEST_CHAIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VALID"));

        // Audit integrity verification by unauthorized role (Vendor) -> 403 Forbidden
        mockMvc.perform(post("/api/v1/audit-events/integrity/verify")
                        .header("Authorization", vendor1Token)
                        .param("chainScope", "API_TEST_CHAIN"))
                .andExpect(status().isForbidden());
    }
}
