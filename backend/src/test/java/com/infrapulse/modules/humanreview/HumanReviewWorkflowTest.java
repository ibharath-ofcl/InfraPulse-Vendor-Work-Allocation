package com.infrapulse.modules.humanreview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.modules.ai.client.AiInferenceClient;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.storage.EvidenceStorageService;
import com.infrapulse.modules.humanreview.dto.*;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.entity.PhysicalMeasurement;
import com.infrapulse.modules.humanreview.model.*;
import com.infrapulse.modules.humanreview.repository.*;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.entity.QualityInspectionTemplate;
import com.infrapulse.modules.quality.model.AssessmentStatus;
import com.infrapulse.modules.quality.model.FindingOutcome;
import com.infrapulse.modules.quality.model.FindingSeverity;
import com.infrapulse.modules.quality.repository.QualityAssessmentFindingRepository;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class HumanReviewWorkflowTest {

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
    private VendorRepository vendorRepository;

    @Autowired
    private WorkAssignmentRepository assignmentRepository;

    @Autowired
    private WorkEvidenceRepository evidenceRepository;

    @Autowired
    private QualityAssessmentRepository assessmentRepository;

    @Autowired
    private QualityInspectionTemplateRepository templateRepository;

    @Autowired
    private QualityAssessmentFindingRepository findingRepository;

    @Autowired
    private HumanInspectionReviewRepository reviewRepository;

    @Autowired
    private HumanInspectionDecisionRepository decisionRepository;

    @Autowired
    private PhysicalMeasurementRepository measurementRepository;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private CorrectiveActionEvidenceRepository correctiveActionEvidenceRepository;

    @Autowired
    private InspectionEscalationRepository escalationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @MockBean
    private AiInferenceClient inferenceClient;

    @MockBean
    private EvidenceStorageService storageService;

    private User adminUser;
    private User engineerUser;
    private User vendorUser;
    private Vendor testVendor;
    private Project testProject;
    private WorkZone testZone;
    private WorkAssignment testAssignment;
    private QualityAssessment testAssessment;
    private HumanInspectionReview testReview;

    private String adminToken;
    private String engineerToken;
    private String vendorToken;

    @BeforeEach
    void setUp() {
        escalationRepository.deleteAll();
        correctiveActionEvidenceRepository.deleteAll();
        correctiveActionRepository.deleteAll();
        measurementRepository.deleteAll();
        decisionRepository.deleteAll();
        reviewRepository.deleteAll();
        findingRepository.deleteAll();
        assessmentRepository.deleteAll();
        evidenceRepository.deleteAll();
        assignmentRepository.deleteAll();
        vendorRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        adminUser = new User(
                UUID.randomUUID().toString(),
                "Super Admin",
                "admin@infrapulse.com",
                passwordEncoder.encode("Password123!"),
                "+919876543210",
                UserRole.PLATFORM_ADMIN,
                UserStatus.ACTIVE
        );
        adminUser = userRepository.save(adminUser);
        adminToken = "Bearer " + tokenProvider.generateAccessToken(adminUser);

        engineerUser = new User(
                UUID.randomUUID().toString(),
                "Field Engineer Dave",
                "engineer@infrapulse.com",
                passwordEncoder.encode("Password123!"),
                "+919876543211",
                UserRole.FIELD_ENGINEER,
                UserStatus.ACTIVE
        );
        engineerUser = userRepository.save(engineerUser);
        engineerToken = "Bearer " + tokenProvider.generateAccessToken(engineerUser);

        vendorUser = new User(
                UUID.randomUUID().toString(),
                "Apex Vendor Rep",
                "vendor@apexinfra.com",
                passwordEncoder.encode("Password123!"),
                "+919876543212",
                UserRole.VENDOR,
                UserStatus.ACTIVE
        );
        vendorUser = userRepository.save(vendorUser);
        vendorToken = "Bearer " + tokenProvider.generateAccessToken(vendorUser);

        // 2. Create Project & Zone
        testProject = new Project(
                UUID.randomUUID().toString(),
                "PRJ-REV-01",
                "Metro Fiber Grid Project",
                "Description",
                ProjectType.FIBER_OPTIC,
                "State Telecom",
                "South", "Karnataka", "Bengaluru Urban", "560001",
                LocalDate.now(), LocalDate.now().plusMonths(6),
                BigDecimal.valueOf(500000), ProjectStatus.ACTIVE,
                adminUser, adminUser
        );
        testProject = projectRepository.save(testProject);

        testZone = new WorkZone(
                UUID.randomUUID().toString(),
                "WZ-REV-01",
                testProject,
                "Zone 1 Whitefield",
                "Whitefield Sector",
                "560066",
                "Whitefield", "Bengaluru Urban", "Karnataka",
                BigDecimal.valueOf(12.9716), BigDecimal.valueOf(77.5946),
                ZoneStatus.ACTIVE, adminUser
        );
        testZone = workZoneRepository.save(testZone);

        // 3. Create Vendor linked to vendorUser
        testVendor = new Vendor();
        testVendor.setVendorCode("VND-REV-01");
        testVendor.setCompanyName("Apex Infrastructure Pvt Ltd");
        testVendor.setContactPerson("Apex Rep");
        testVendor.setEmail("vendor@apexinfra.com");
        testVendor.setPhoneNumber("+919876543212");
        testVendor.setAddressLine("Plot 12 Whitefield");
        testVendor.setCity("Bengaluru");
        testVendor.setDistrict("Bengaluru Urban");
        testVendor.setState("Karnataka");
        testVendor.setPincode("560066");
        testVendor.setStatus(VendorStatus.ACTIVE);
        testVendor.setServiceCategories(Set.of(ServiceCategory.TRENCHING));
        testVendor.setUser(vendorUser);
        testVendor.setCreatedBy(adminUser);
        testVendor = vendorRepository.save(testVendor);

        // 4. Create WorkAssignment
        testAssignment = new WorkAssignment(
                UUID.randomUUID().toString(),
                "WA-TRENCH-901",
                testProject,
                testZone,
                testVendor,
                WorkType.TRENCHING,
                "Underground Trenching Route A",
                "Trenching work for optical cable",
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                AssignmentPriority.HIGH,
                AssignmentStatus.SUBMITTED_FOR_REVIEW,
                "Follow standard 1.2m depth",
                adminUser
        );
        testAssignment.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        testAssignment = assignmentRepository.save(testAssignment);

        QualityInspectionTemplate template = templateRepository.findFirstByWorkTypeAndIsActiveTrueOrderByVersionDesc(WorkType.TRENCHING)
                .orElseGet(() -> {
                    QualityInspectionTemplate t = new QualityInspectionTemplate();
                    t.setTemplateCode("TMPL-TRENCH-TEST");
                    t.setName("Trenching Test Template");
                    t.setWorkType(WorkType.TRENCHING);
                    t.setVersion("1.0.0");
                    t.setActive(true);
                    return templateRepository.save(t);
                });

        // 5. Create QualityAssessment
        testAssessment = new QualityAssessment();
        testAssessment.setAssessmentCode("QA-2026-0001");
        testAssessment.setAssignment(testAssignment);
        testAssessment.setTemplate(template);
        testAssessment.setTemplateVersion(template.getVersion());
        testAssessment.setStatus(AssessmentStatus.REQUIRES_HUMAN_REVIEW);
        testAssessment.setEvidenceCompletenessScore(95.0);
        testAssessment.setTotalCriteriaEvaluated(5);
        testAssessment.setPassedCriteriaCount(3);
        testAssessment.setFlaggedCriteriaCount(1);
        testAssessment.setFailedCriteriaCount(1);
        testAssessment.setFindingsCount(2);
        testAssessment = assessmentRepository.save(testAssessment);

        // Finding 1: requires physical measurement
        QualityAssessmentFinding f1 = new QualityAssessmentFinding();
        f1.setAssessment(testAssessment);
        f1.setCriterionCode("TR-02");
        f1.setCriterionName("Trench Depth Verification");
        f1.setSeverity(FindingSeverity.HIGH);
        f1.setOutcome(FindingOutcome.REQUIRES_PHYSICAL_MEASUREMENT);
        f1.setTitle("Physical Depth Measurement Required");
        f1.setDescription("Specification requires physical dip-rod measurement of 1.2m depth");
        findingRepository.save(f1);

        // Finding 2: failure
        QualityAssessmentFinding f2 = new QualityAssessmentFinding();
        f2.setAssessment(testAssessment);
        f2.setCriterionCode("TR-03");
        f2.setCriterionName("Warning Tape Installation");
        f2.setSeverity(FindingSeverity.CRITICAL);
        f2.setOutcome(FindingOutcome.FAIL);
        f2.setTitle("Warning Tape Missing");
        f2.setDescription("No optical warning tape visible in trench photo");
        findingRepository.save(f2);

        // 6. Create Review
        testReview = new HumanInspectionReview();
        testReview.setReviewCode("HIR-00001");
        testReview.setAssessment(testAssessment);
        testReview.setAssignment(testAssignment);
        testReview.setPriority(ReviewPriority.HIGH);
        testReview.setReviewStatus(ReviewStatus.PENDING);
        testReview = reviewRepository.save(testReview);
    }

    @Test
    @DisplayName("Human Review Queue: Should list pending inspection review items")
    void testGetReviewQueue() throws Exception {
        mockMvc.perform(get("/api/v1/human-reviews")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].reviewCode").value("HIR-00001"))
                .andExpect(jsonPath("$.data.content[0].assignmentCode").value("WA-TRENCH-901"))
                .andExpect(jsonPath("$.data.content[0].priority").value("HIGH"));
    }

    @Test
    @DisplayName("Review Workspace: Should return review detail with assessment findings")
    void testGetReviewDetail() throws Exception {
        mockMvc.perform(get("/api/v1/human-reviews/" + testReview.getId())
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reviewCode").value("HIR-00001"))
                .andExpect(jsonPath("$.data.assessment.findings", hasSize(2)));
    }

    @Test
    @DisplayName("Assign Reviewer: Engineer assigns review and transitions status to IN_REVIEW")
    void testAssignReviewer() throws Exception {
        mockMvc.perform(post("/api/v1/human-reviews/" + testReview.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reviewerId", engineerUser.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reviewerName").value("Field Engineer Dave"))
                .andExpect(jsonPath("$.data.reviewStatus").value("IN_REVIEW"));
    }

    @Test
    @DisplayName("Rule 2 Validation: Cannot record APPROVED decision when mandatory findings are failing or unresolved")
    void testRecordDecision_RejectedWhenRule2Fails() throws Exception {
        RecordDecisionRequest request = new RecordDecisionRequest(
                ReviewDecisionType.APPROVED,
                "All good to go without verification",
                "No notes"
        );

        mockMvc.perform(post("/api/v1/human-reviews/" + testReview.getId() + "/decisions")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Cannot approve inspection")));
    }

    @Test
    @DisplayName("Physical Measurement: Record measurement without spec flags SPECIFICATION_REQUIRED, with spec passes")
    void testRecordAndVerifyPhysicalMeasurement() throws Exception {
        // 1. Record measurement without specification -> SPECIFICATION_REQUIRED
        RecordMeasurementRequest reqWithoutSpec = new RecordMeasurementRequest();
        reqWithoutSpec.setMeasurementType(PhysicalMeasurementType.TRENCH_DEPTH);
        reqWithoutSpec.setMeasuredValue(1.25);
        reqWithoutSpec.setUnit(MeasurementUnit.METERS);
        reqWithoutSpec.setRemarks("Rough dipstick check");

        mockMvc.perform(post("/api/v1/quality/assessments/" + testAssessment.getId() + "/measurements")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWithoutSpec)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verificationStatus").value("SPECIFICATION_REQUIRED"));

        // 2. Record measurement WITH engineering specification -> VERIFIED_PASS
        RecordMeasurementRequest reqWithSpec = new RecordMeasurementRequest();
        reqWithSpec.setMeasurementType(PhysicalMeasurementType.TRENCH_DEPTH);
        reqWithSpec.setMeasuredValue(1.22);
        reqWithSpec.setUnit(MeasurementUnit.METERS);
        reqWithSpec.setSpecificationReference("IS-1255: Underground Telecommunication Trench Standard");
        reqWithSpec.setSpecificationVersion("Rev 4");
        reqWithSpec.setMinAcceptableValue(1.20);
        reqWithSpec.setMaxAcceptableValue(1.50);
        reqWithSpec.setRemarks("Calibrated electronic dip meter");

        mockMvc.perform(post("/api/v1/quality/assessments/" + testAssessment.getId() + "/measurements")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqWithSpec)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED_PASS"));
    }

    @Test
    @DisplayName("Corrective Action & Security: Vendors CANNOT approve or verify corrective actions")
    void testCorrectiveActionWorkflowAndVendorRestriction() throws Exception {
        // 1. Engineer opens corrective action for vendor
        CreateCorrectiveActionRequest caReq = new CreateCorrectiveActionRequest();
        caReq.setActionType(CorrectiveActionType.REPAIR_OR_REWORK);
        caReq.setDescription("Install optical warning tape 30cm above cable layer");
        caReq.setPriority(ReviewPriority.HIGH);
        caReq.setSeverity(FindingSeverity.CRITICAL);

        String caResponseJson = mockMvc.perform(post("/api/v1/quality/assessments/" + testAssessment.getId() + "/corrective-actions")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(caReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.actionCode", startsWith("CA-")))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andReturn().getResponse().getContentAsString();

        CorrectiveActionDto caDto = objectMapper.readTree(caResponseJson).get("data").traverse(objectMapper).readValueAs(CorrectiveActionDto.class);

        // 2. Create evidence uploaded by vendor
        WorkEvidence reworkEvidence = new WorkEvidence();
        reworkEvidence.setEvidenceCode("EV-REWORK-01");
        reworkEvidence.setProject(testProject);
        reworkEvidence.setWorkZone(testZone);
        reworkEvidence.setWorkAssignment(testAssignment);
        reworkEvidence.setVendor(testVendor);
        reworkEvidence.setUploadedBy(vendorUser);
        reworkEvidence.setEvidenceCategory(EvidenceCategory.COMPLETION_EVIDENCE);
        reworkEvidence.setOriginalFileName("tape_installed.jpg");
        reworkEvidence.setStorageKey("evidence/tape_installed.jpg");
        reworkEvidence.setMimeType("image/jpeg");
        reworkEvidence.setFileSize(102400L);
        reworkEvidence.setChecksumSha256("hash1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
        reworkEvidence.setDescription("Warning tape installation complete");
        reworkEvidence = evidenceRepository.save(reworkEvidence);

        // 3. Vendor submits rework proof
        SubmitCorrectiveEvidenceRequest submitReq = new SubmitCorrectiveEvidenceRequest(
                reworkEvidence.getId(),
                "Installed warning tape per specification",
                "Vendor rework complete"
        );

        mockMvc.perform(post("/api/v1/corrective-actions/" + caDto.getId() + "/submit")
                        .header("Authorization", vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED_FOR_VERIFICATION"));

        // 4. Vendor attempts to approve/verify own corrective action -> 403 FORBIDDEN
        VerifyCorrectiveActionRequest verifyReq = new VerifyCorrectiveActionRequest(
                CorrectiveActionStatus.VERIFIED,
                "Vendor self-approval"
        );

        mockMvc.perform(post("/api/v1/corrective-actions/" + caDto.getId() + "/verify")
                        .header("Authorization", vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isForbidden());

        // 5. Authorized Field Engineer verifies and closes corrective action -> 200 OK
        VerifyCorrectiveActionRequest engineerVerify = new VerifyCorrectiveActionRequest(
                CorrectiveActionStatus.VERIFIED,
                "Verified warning tape installation visually from submitted photo"
        );

        mockMvc.perform(post("/api/v1/corrective-actions/" + caDto.getId() + "/verify")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(engineerVerify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));
    }

    @Test
    @DisplayName("Stage 6 Integration: Decision APPROVED grants release clearance RELEASED for assignment")
    void testApprovalDecisionReleasesAssignment() throws Exception {
        // Resolve finding 1 with verified measurement
        PhysicalMeasurement pm = new PhysicalMeasurement();
        pm.setMeasurementCode("PM-00099");
        pm.setAssessment(testAssessment);
        pm.setMeasurementType(PhysicalMeasurementType.TRENCH_DEPTH);
        pm.setMeasuredValue(1.25);
        pm.setUnit(MeasurementUnit.METERS);
        pm.setSpecificationReference("SPEC-01");
        pm.setMinAcceptableValue(1.20);
        pm.setMaxAcceptableValue(1.50);
        pm.setInspector(engineerUser);
        pm.setVerificationStatus(MeasurementVerificationStatus.VERIFIED_PASS);
        measurementRepository.save(pm);

        // Update finding 1 and 2 to PASS for this test case
        var findings = findingRepository.findByAssessmentIdOrderByCreatedAtAsc(testAssessment.getId());
        for (var f : findings) {
            f.setOutcome(FindingOutcome.PASS);
            findingRepository.save(f);
        }

        RecordDecisionRequest approveReq = new RecordDecisionRequest(
                ReviewDecisionType.APPROVED,
                "All quality checks, physical measurements, and photographic evidence verified to standards.",
                "Authorized release granted."
        );

        mockMvc.perform(post("/api/v1/human-reviews/" + testReview.getId() + "/decisions")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.decisionType").value("APPROVED"));

        // Verify WorkAssignment releaseStatus is RELEASED
        WorkAssignment updatedAssignment = assignmentRepository.findById(testAssignment.getId()).orElseThrow();
        assertEquals(ReleaseStatus.RELEASED, updatedAssignment.getReleaseStatus());
        assertEquals(AssignmentStatus.COMPLETED, updatedAssignment.getStatus());
        assertNotNull(updatedAssignment.getReleasedAt());
        assertNotNull(updatedAssignment.getReleasedBy());

        // Verify Human Review is COMPLETED
        HumanInspectionReview updatedReview = reviewRepository.findById(testReview.getId()).orElseThrow();
        assertEquals(ReviewStatus.COMPLETED, updatedReview.getReviewStatus());
        assertNotNull(updatedReview.getCompletedAt());
    }

    @Test
    @DisplayName("Escalation: Review can be escalated with reason and sets priority CRITICAL")
    void testEscalateReview() throws Exception {
        CreateEscalationRequest escReq = new CreateEscalationRequest(
                "Vendor disputes trench depth specification requirement",
                "CRITICAL",
                "PROJECT_MANAGER",
                adminUser.getId()
        );

        mockMvc.perform(post("/api/v1/human-reviews/" + testReview.getId() + "/escalate")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(escReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.severity").value("CRITICAL"));

        HumanInspectionReview updatedReview = reviewRepository.findById(testReview.getId()).orElseThrow();
        assertEquals(ReviewStatus.ESCALATED, updatedReview.getReviewStatus());
        assertEquals(ReviewPriority.CRITICAL, updatedReview.getPriority());
    }

    @AfterEach
    void tearDown() {
        escalationRepository.deleteAll();
        correctiveActionEvidenceRepository.deleteAll();
        correctiveActionRepository.deleteAll();
        measurementRepository.deleteAll();
        decisionRepository.deleteAll();
        reviewRepository.deleteAll();
        findingRepository.deleteAll();
        assessmentRepository.deleteAll();
        evidenceRepository.deleteAll();
        assignmentRepository.deleteAll();
        vendorRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }
}
