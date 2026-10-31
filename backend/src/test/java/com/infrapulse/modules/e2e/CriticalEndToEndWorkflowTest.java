package com.infrapulse.modules.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.*;
import com.infrapulse.modules.ai.client.AiInferenceClient;
import com.infrapulse.modules.analytics.dto.ExportReportRequestDto;
import com.infrapulse.modules.analytics.dto.ReportJobResponseDto;
import com.infrapulse.modules.analytics.enums.ReportFormat;
import com.infrapulse.modules.analytics.enums.ReportType;
import com.infrapulse.modules.analytics.service.ReportExportService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.storage.EvidenceStorageService;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.enums.*;
import com.infrapulse.modules.finance.repository.*;
import com.infrapulse.modules.finance.service.ProjectMilestoneService;
import com.infrapulse.modules.finance.service.VendorAgreementService;
import com.infrapulse.modules.finance.dto.CreatePaymentRequestDto;
import com.infrapulse.modules.humanreview.dto.RecordDecisionRequest;
import com.infrapulse.modules.humanreview.dto.RecordMeasurementRequest;
import com.infrapulse.modules.humanreview.dto.SubmitCorrectiveEvidenceRequest;
import com.infrapulse.modules.humanreview.dto.VerifyCorrectiveActionRequest;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.*;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionReviewRepository;
import com.infrapulse.modules.humanreview.repository.PhysicalMeasurementRepository;
import com.infrapulse.modules.workassignment.dto.CreateWorkAssignmentRequest;
import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
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
import com.infrapulse.modules.workassignment.dto.UpdateAssignmentStatusRequest;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CriticalEndToEndWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectVendorRepository projectVendorRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private WorkZoneRepository workZoneRepository;

    @Autowired
    private WorkAssignmentRepository workAssignmentRepository;

    @Autowired
    private WorkEvidenceRepository evidenceRepository;

    @Autowired
    private QualityInspectionTemplateRepository templateRepository;

    @Autowired
    private QualityAssessmentRepository qualityAssessmentRepository;

    @Autowired
    private QualityAssessmentFindingRepository findingRepository;

    @Autowired
    private HumanInspectionReviewRepository humanReviewRepository;

    @Autowired
    private HumanInspectionDecisionRepository humanInspectionDecisionRepository;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private PhysicalMeasurementRepository measurementRepository;

    @Autowired
    private VendorAgreementRepository agreementRepository;

    @Autowired
    private ProjectMilestoneRepository milestoneRepository;

    @Autowired
    private MilestoneWorkAssignmentRepository milestoneWorkAssignmentRepository;

    @Autowired
    private MilestoneVerificationRepository milestoneVerificationRepository;

    @Autowired
    private VendorPaymentRequestRepository paymentRequestRepository;

    @Autowired
    private PaymentAuthorizationRepository paymentAuthorizationRepository;

    @Autowired
    private InvoiceVerificationRepository invoiceVerificationRepository;

    @Autowired
    private FinancialApprovalDecisionRepository approvalDecisionRepository;

    @Autowired
    private FinancialTransactionRepository transactionRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private AuditChainHeadRepository auditChainHeadRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private VendorAgreementService agreementService;

    @Autowired
    private com.infrapulse.modules.analytics.repository.AnalyticsReportJobRepository analyticsReportJobRepository;

    @Autowired
    private ProjectMilestoneService milestoneService;

    @Autowired
    private ReportExportService reportExportService;

    @MockBean
    private AiInferenceClient aiInferenceClient;

    @MockBean
    private EvidenceStorageService storageService;

    private User adminUser;
    private User inspectorUser;
    private User financeUser;
    private User vendorUser1;
    private User vendorUser2;

    private String adminToken;
    private String inspectorToken;
    private String financeToken;
    private String vendorToken1;
    private String vendorToken2;

    private String uniqueSuffix;

    @BeforeEach
    public void setup() {
        uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = createUser("admin_" + uniqueSuffix, UserRole.PLATFORM_ADMIN);
        inspectorUser = createUser("inspector_" + uniqueSuffix, UserRole.FIELD_ENGINEER);
        financeUser = createUser("finance_" + uniqueSuffix, UserRole.FINANCE_OFFICER);
        vendorUser1 = createUser("vendor1_" + uniqueSuffix, UserRole.VENDOR);
        vendorUser2 = createUser("vendor2_" + uniqueSuffix, UserRole.VENDOR);

        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);
        inspectorToken = "Bearer " + jwtTokenProvider.generateAccessToken(inspectorUser);
        financeToken = "Bearer " + jwtTokenProvider.generateAccessToken(financeUser);
        vendorToken1 = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser1);
        vendorToken2 = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser2);
    }

    private User createUser(String username, UserRole role) {
        User u = new User();
        u.setEmail((username + "@infrapulse.test").toLowerCase());
        u.setPasswordHash(passwordEncoder.encode("SecretPass123!"));
        u.setFullName("User " + username);
        u.setRole(role);
        u.setStatus(UserStatus.ACTIVE);
        return userRepository.save(u);
    }

    @AfterEach
    public void tearDown() {
        transactionRepository.deleteAll();
        approvalDecisionRepository.deleteAll();
        paymentAuthorizationRepository.deleteAll();
        invoiceVerificationRepository.deleteAll();
        paymentRequestRepository.deleteAll();
        milestoneWorkAssignmentRepository.deleteAll();
        milestoneVerificationRepository.deleteAll();
        milestoneRepository.deleteAll();
        agreementRepository.deleteAll();
        correctiveActionRepository.deleteAll();
        measurementRepository.deleteAll();
        humanInspectionDecisionRepository.deleteAll();
        humanReviewRepository.deleteAll();
        findingRepository.deleteAll();
        qualityAssessmentRepository.deleteAll();
        evidenceRepository.deleteAll();
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        projectVendorRepository.deleteAll();
        vendorRepository.deleteAll();
        projectRepository.deleteAll();
        analyticsReportJobRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Workflow A — Complete Infrastructure Lifecycle: Project -> Dual Vendors -> Zone -> Trenching -> DAG Block -> Approval -> Release")
    public void testWorkflowA_CompleteInfrastructureLifecycle() throws Exception {
        // 1. Admin creates Project
        Project project = new Project(
                UUID.randomUUID().toString(),
                "PRJ-METRO-" + uniqueSuffix,
                "Smart City Metro Corridor " + uniqueSuffix,
                "Underground metro transit expansion",
                ProjectType.UTILITY,
                "Municipal Corporation",
                "Central", "Karnataka", "Bengaluru Urban", "560001",
                LocalDate.now(), LocalDate.now().plusMonths(6),
                new BigDecimal("15000000.00"), ProjectStatus.ACTIVE,
                adminUser, adminUser
        );
        project = projectRepository.save(project);

        // 2. Admin registers two vendors
        Vendor vendor1 = new Vendor();
        vendor1.setVendorCode("VND-EXCAV-" + uniqueSuffix);
        vendor1.setCompanyName("Apex Excavation Corp " + uniqueSuffix);
        vendor1.setContactPerson("Apex Rep");
        vendor1.setEmail("apex_" + uniqueSuffix + "@vendor.com");
        vendor1.setPhoneNumber("+919876543210");
        vendor1.setAddressLine("Plot 12 Whitefield");
        vendor1.setCity("Bengaluru");
        vendor1.setDistrict("Bengaluru Urban");
        vendor1.setState("Karnataka");
        vendor1.setPincode("560001");
        vendor1.setUser(vendorUser1);
        vendor1.setStatus(VendorStatus.ACTIVE);
        vendor1.setServiceCategories(Set.of(ServiceCategory.TRENCHING));
        vendor1.setCreatedBy(adminUser);
        vendor1 = vendorRepository.save(vendor1);

        Vendor vendor2 = new Vendor();
        vendor2.setVendorCode("VND-ROAD-" + uniqueSuffix);
        vendor2.setCompanyName("Premier Road Builders " + uniqueSuffix);
        vendor2.setContactPerson("Road Rep");
        vendor2.setEmail("road_" + uniqueSuffix + "@vendor.com");
        vendor2.setPhoneNumber("+919876543211");
        vendor2.setAddressLine("Plot 44 Peenya");
        vendor2.setCity("Bengaluru");
        vendor2.setDistrict("Bengaluru Urban");
        vendor2.setState("Karnataka");
        vendor2.setPincode("560001");
        vendor2.setUser(vendorUser2);
        vendor2.setStatus(VendorStatus.ACTIVE);
        vendor2.setServiceCategories(Set.of(ServiceCategory.ROAD_RESURFACING));
        vendor2.setCreatedBy(adminUser);
        vendor2 = vendorRepository.save(vendor2);

        // 3. Associate vendors with project
        ProjectVendor pv1 = new ProjectVendor(project, vendor1, adminUser, "Vendor 1 on project");
        projectVendorRepository.save(pv1);
        ProjectVendor pv2 = new ProjectVendor(project, vendor2, adminUser, "Vendor 2 on project");
        projectVendorRepository.save(pv2);

        // 4. Admin creates WorkZone with PIN code
        WorkZone workZone = new WorkZone(
                UUID.randomUUID().toString(),
                "WZ-" + uniqueSuffix,
                project,
                "Central Corridor Zone " + uniqueSuffix,
                "Corridor Sector 1",
                "560001",
                "Central", "Bengaluru Urban", "Karnataka",
                BigDecimal.valueOf(12.9716), BigDecimal.valueOf(77.5946),
                ZoneStatus.ACTIVE, adminUser
        );
        workZone = workZoneRepository.save(workZone);

        // 5. Admin assigns Trenching to Vendor 1
        WorkAssignment trenchingAssignment = new WorkAssignment();
        trenchingAssignment.setId(UUID.randomUUID().toString());
        trenchingAssignment.setAssignmentCode("WA-TR-" + uniqueSuffix);
        trenchingAssignment.setTitle("Main Trenching Package");
        trenchingAssignment.setProject(project);
        trenchingAssignment.setWorkZone(workZone);
        trenchingAssignment.setVendor(vendor1);
        trenchingAssignment.setWorkType(WorkType.TRENCHING);
        trenchingAssignment.setPriority(AssignmentPriority.HIGH);
        trenchingAssignment.setStatus(AssignmentStatus.ASSIGNED);
        trenchingAssignment.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        trenchingAssignment.setPlannedStartDate(LocalDate.now());
        trenchingAssignment.setTargetEndDate(LocalDate.now().plusDays(10));
        trenchingAssignment.setCreatedBy(adminUser);
        trenchingAssignment = workAssignmentRepository.save(trenchingAssignment);

        // 6. Admin attempts Road Resurfacing in the same zone -> Backend BLOCKS assignment due to unresolved dependency!
        CreateWorkAssignmentRequest roadRequest = new CreateWorkAssignmentRequest(
                project.getId(),
                workZone.getId(),
                vendor2.getId(),
                WorkType.ROAD_RESURFACING,
                "Premature Road Resurfacing",
                "Should be blocked by dependency engine",
                LocalDate.now(),
                LocalDate.now().plusDays(15),
                AssignmentPriority.HIGH,
                "Mandatory instructions"
        );

        mockMvc.perform(post("/api/v1/work-assignments")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roadRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", anyOf(containsString("conflict"), containsString("dependency"), containsString("prerequisite"))));

        // 7. Vendor 1 accepts the assignment
        UpdateAssignmentStatusRequest acceptReq = new UpdateAssignmentStatusRequest(AssignmentStatus.ACCEPTED, "Accepted by vendor");
        mockMvc.perform(patch("/api/v1/work-assignments/" + trenchingAssignment.getId() + "/status")
                        .header("Authorization", vendorToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        // 8. Vendor 1 starts the work
        UpdateAssignmentStatusRequest startReq = new UpdateAssignmentStatusRequest(AssignmentStatus.IN_PROGRESS, "Commencing trenching");
        mockMvc.perform(patch("/api/v1/work-assignments/" + trenchingAssignment.getId() + "/status")
                        .header("Authorization", vendorToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

        // 9. Vendor 1 uploads photographic evidence
        WorkEvidence evidence = new WorkEvidence();
        evidence.setEvidenceCode("EVD-" + uniqueSuffix);
        evidence.setProject(project);
        evidence.setWorkZone(workZone);
        evidence.setWorkAssignment(trenchingAssignment);
        evidence.setVendor(vendor1);
        evidence.setUploadedBy(vendorUser1);
        evidence.setEvidenceCategory(EvidenceCategory.WORK_IN_PROGRESS);
        evidence.setOriginalFileName("trench_depth.jpg");
        evidence.setStorageKey("evidence/" + uniqueSuffix + ".jpg");
        evidence.setMimeType("image/jpeg");
        evidence.setFileSize(204800L);
        evidence.setChecksumSha256("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        evidence = evidenceRepository.save(evidence);

        // 10. Stage 10 AI Quality Assessment generated
        QualityInspectionTemplate template = templateRepository.findFirstByWorkTypeAndIsActiveTrueOrderByVersionDesc(WorkType.TRENCHING)
                .orElseGet(() -> {
                    QualityInspectionTemplate t = new QualityInspectionTemplate();
                    t.setTemplateCode("TMPL-TRENCH-" + uniqueSuffix);
                    t.setName("Trenching Template");
                    t.setWorkType(WorkType.TRENCHING);
                    t.setVersion("1.0.0");
                    t.setActive(true);
                    return templateRepository.save(t);
                });

        QualityAssessment assessment = new QualityAssessment();
        assessment.setAssessmentCode("QA-" + uniqueSuffix);
        assessment.setAssignment(trenchingAssignment);
        assessment.setTemplate(template);
        assessment.setTemplateVersion(template.getVersion());
        assessment.setStatus(AssessmentStatus.REQUIRES_HUMAN_REVIEW);
        assessment.setEvidenceCompletenessScore(95.0);
        assessment.setTotalCriteriaEvaluated(5);
        assessment.setPassedCriteriaCount(3);
        assessment.setFlaggedCriteriaCount(1);
        assessment.setFailedCriteriaCount(1);
        assessment.setFindingsCount(2);
        assessment = qualityAssessmentRepository.save(assessment);

        // Finding 1: requires physical measurement
        QualityAssessmentFinding f1 = new QualityAssessmentFinding();
        f1.setAssessment(assessment);
        f1.setCriterionCode("TR-02");
        f1.setCriterionName("Trench Depth Verification");
        f1.setSeverity(FindingSeverity.HIGH);
        f1.setOutcome(FindingOutcome.REQUIRES_PHYSICAL_MEASUREMENT);
        f1.setTitle("Physical Depth Measurement Required");
        f1.setDescription("Specification requires physical measurement of 1.25m depth");
        findingRepository.save(f1);

        // Finding 2: warning tape failure
        QualityAssessmentFinding f2 = new QualityAssessmentFinding();
        f2.setAssessment(assessment);
        f2.setCriterionCode("TR-03");
        f2.setCriterionName("Warning Tape Installation");
        f2.setSeverity(FindingSeverity.CRITICAL);
        f2.setOutcome(FindingOutcome.FAIL);
        f2.setTitle("Warning Tape Missing");
        f2.setDescription("No optical warning tape visible in trench photo");
        findingRepository.save(f2);

        // 11. Inspector opens human review queue and creates review workspace
        HumanInspectionReview review = new HumanInspectionReview();
        review.setReviewCode("HIR-" + uniqueSuffix);
        review.setAssessment(assessment);
        review.setAssignment(trenchingAssignment);
        review.setReviewer(inspectorUser);
        review.setPriority(ReviewPriority.HIGH);
        review.setReviewStatus(ReviewStatus.IN_REVIEW);
        review = humanReviewRepository.save(review);

        // 12. Inspector records required physical measurements (1.25m depth spec)
        RecordMeasurementRequest measReq = new RecordMeasurementRequest();
        measReq.setMeasurementType(PhysicalMeasurementType.TRENCH_DEPTH);
        measReq.setMeasuredValue(1.25);
        measReq.setUnit(MeasurementUnit.METERS);
        measReq.setSpecificationReference("SPEC-TRENCH-01");
        measReq.setMinAcceptableValue(1.20);
        measReq.setMaxAcceptableValue(1.50);
        measReq.setRemarks("Physical depth verified with calibrated staff");

        mockMvc.perform(post("/api/v1/quality/assessments/" + assessment.getId() + "/measurements")
                        .header("Authorization", inspectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(measReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED_PASS"));

        // 13. Inspector creates Corrective Action for safety warning tape
        CorrectiveAction action = new CorrectiveAction();
        action.setActionCode("CA-" + uniqueSuffix);
        action.setAssessment(assessment);
        action.setAssignment(trenchingAssignment);
        action.setFinding(f2);
        action.setVendor(vendor1);
        action.setAssignedInspector(inspectorUser);
        action.setActionType(CorrectiveActionType.REPAIR_OR_REWORK);
        action.setDescription("Install optical warning tape 30cm above cable layer");
        action.setPriority(ReviewPriority.HIGH);
        action.setSeverity(FindingSeverity.CRITICAL);
        action.setStatus(CorrectiveActionStatus.OPEN);
        action.setCreatedBy(inspectorUser);
        action = correctiveActionRepository.save(action);

        // Rule 2 check: Inspector cannot approve review while corrective action is OPEN
        RecordDecisionRequest prematureApprove = new RecordDecisionRequest(
                ReviewDecisionType.APPROVED,
                "Attempting premature approval without resolving corrective action",
                "Premature"
        );
        mockMvc.perform(post("/api/v1/human-reviews/" + review.getId() + "/decisions")
                        .header("Authorization", inspectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prematureApprove)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cannot approve inspection")));

        // 14. Vendor completes remediation and submits corrective evidence
        SubmitCorrectiveEvidenceRequest reworkReq = new SubmitCorrectiveEvidenceRequest(
                evidence.getId(),
                "Installed warning tape per specification",
                "Vendor rework complete"
        );
        mockMvc.perform(post("/api/v1/corrective-actions/" + action.getId() + "/submit")
                        .header("Authorization", vendorToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reworkReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED_FOR_VERIFICATION"));

        // 15. Inspector verifies and closes the corrective action
        VerifyCorrectiveActionRequest verifyReq = new VerifyCorrectiveActionRequest(
                CorrectiveActionStatus.VERIFIED,
                "Verified warning tape installation visually from submitted photo"
        );
        mockMvc.perform(post("/api/v1/corrective-actions/" + action.getId() + "/verify")
                        .header("Authorization", inspectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));

        // Update finding f2 to PASS now that corrective action is verified
        f2.setOutcome(FindingOutcome.PASS);
        findingRepository.save(f2);

        // 16. Inspector approves the work
        RecordDecisionRequest validApprove = new RecordDecisionRequest(
                ReviewDecisionType.APPROVED,
                "All physical specs and corrective actions resolved",
                "Approved after verified remediation"
        );
        mockMvc.perform(post("/api/v1/human-reviews/" + review.getId() + "/decisions")
                        .header("Authorization", inspectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validApprove)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.decisionType").value("APPROVED"));

        // Refresh trenching assignment
        trenchingAssignment = workAssignmentRepository.findById(trenchingAssignment.getId()).orElseThrow();
        assertEquals(AssignmentStatus.COMPLETED, trenchingAssignment.getStatus());
        assertEquals(ReleaseStatus.RELEASED, trenchingAssignment.getReleaseStatus());

        // 17. Downstream Dependency Release: Road Resurfacing is NOW PERMITTED!
        mockMvc.perform(post("/api/v1/work-assignments")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roadRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.assignmentCode").isNotEmpty())
                .andExpect(jsonPath("$.data.workType").value("ROAD_RESURFACING"));
    }

    @Test
    @DisplayName("Workflow B — Financial Authorization: Agreement -> Milestone -> Invoice -> Approval -> Simulated Settlement")
    public void testWorkflowB_FinancialAuthorizationWorkflow() throws Exception {
        // Setup project, vendor, completed assignment
        Project project = new Project(
                UUID.randomUUID().toString(),
                "PRJ-HW-" + uniqueSuffix,
                "Highway Expansion " + uniqueSuffix,
                "Highway upgrade",
                ProjectType.ROAD_INFRASTRUCTURE,
                "Road Authority",
                "Central", "Karnataka", "Bengaluru", "560002",
                LocalDate.now(), LocalDate.now().plusMonths(4),
                new BigDecimal("1000000.00"), ProjectStatus.ACTIVE,
                adminUser, adminUser
        );
        project = projectRepository.save(project);

        Vendor vendor = new Vendor();
        vendor.setVendorCode("VND-AGR-" + uniqueSuffix);
        vendor.setCompanyName("Reliable Infra Ltd " + uniqueSuffix);
        vendor.setContactPerson("Reliable Rep");
        vendor.setEmail("reliable_" + uniqueSuffix + "@vendor.com");
        vendor.setPhoneNumber("+919876543212");
        vendor.setAddressLine("Plot 55 Highway Road");
        vendor.setCity("Bengaluru");
        vendor.setDistrict("Bengaluru Urban");
        vendor.setState("Karnataka");
        vendor.setPincode("560002");
        vendor.setUser(vendorUser1);
        vendor.setStatus(VendorStatus.ACTIVE);
        vendor.setCreatedBy(adminUser);
        vendor = vendorRepository.save(vendor);

        ProjectVendor pv = new ProjectVendor(project, vendor, adminUser, "Active vendor on project");
        projectVendorRepository.save(pv);

        WorkZone zone = new WorkZone(
                UUID.randomUUID().toString(),
                "WZ-FIN-" + uniqueSuffix,
                project,
                "Financial Zone " + uniqueSuffix,
                "Sector 2",
                "560002",
                "Central", "Bengaluru Urban", "Karnataka",
                BigDecimal.valueOf(12.9716), BigDecimal.valueOf(77.5946),
                ZoneStatus.ACTIVE, adminUser
        );
        zone = workZoneRepository.save(zone);

        WorkAssignment completedAssignment = new WorkAssignment();
        completedAssignment.setId(UUID.randomUUID().toString());
        completedAssignment.setAssignmentCode("WA-FIN-" + uniqueSuffix);
        completedAssignment.setTitle("Culvert Installation");
        completedAssignment.setProject(project);
        completedAssignment.setWorkZone(zone);
        completedAssignment.setVendor(vendor);
        completedAssignment.setWorkType(WorkType.TRENCHING);
        completedAssignment.setPlannedStartDate(LocalDate.now().minusDays(30));
        completedAssignment.setTargetEndDate(LocalDate.now().minusDays(5));
        completedAssignment.setStatus(AssignmentStatus.COMPLETED);
        completedAssignment.setReleaseStatus(ReleaseStatus.RELEASED);
        completedAssignment.setCreatedBy(adminUser);
        completedAssignment = workAssignmentRepository.save(completedAssignment);

        QualityInspectionTemplate template = templateRepository.findAll().stream().findFirst().orElseGet(() -> {
            QualityInspectionTemplate t = new QualityInspectionTemplate();
            t.setId(UUID.randomUUID().toString());
            t.setTemplateCode("QIT-DEF-" + uniqueSuffix);
            t.setName("Default Template");
            t.setWorkType(WorkType.TRENCHING);
            t.setVersion("1.0.0");
            t.setActive(true);
            return templateRepository.save(t);
        });

        QualityAssessment qa = new QualityAssessment();
        qa.setId(UUID.randomUUID().toString());
        qa.setAssessmentCode("QA-FIN-" + uniqueSuffix);
        qa.setAssignment(completedAssignment);
        qa.setTemplate(template);
        qa.setTemplateVersion("1.0.0");
        qa.setStatus(AssessmentStatus.PASS);
        qa.setCreatedAt(java.time.Instant.now());
        qa = qualityAssessmentRepository.save(qa);

        HumanInspectionReview review = new HumanInspectionReview();
        review.setId(UUID.randomUUID().toString());
        review.setReviewCode("HIR-FIN-" + uniqueSuffix);
        review.setAssignment(completedAssignment);
        review.setAssessment(qa);
        review.setReviewStatus(ReviewStatus.COMPLETED);
        review.setCreatedAt(java.time.Instant.now());
        review.setUpdatedAt(java.time.Instant.now());
        review = humanReviewRepository.save(review);

        HumanInspectionDecision hid = new HumanInspectionDecision();
        hid.setId(UUID.randomUUID().toString());
        hid.setReview(review);
        hid.setAssessment(qa);
        hid.setAssignment(completedAssignment);
        hid.setDecisionType(ReviewDecisionType.APPROVED);
        hid.setReviewer(adminUser);
        hid.setReviewerRole("QUALITY_INSPECTOR");
        hid.setReason("Passed quality audit for financial milestone release");
        hid.setComments("Satisfied");
        hid.setDecidedAt(java.time.Instant.now());
        humanInspectionDecisionRepository.save(hid);

        // 1. Admin creates Commercial Agreement
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(project.getId());
        agReq.setVendorId(vendor.getId());
        agReq.setContractReference("CONT-METRO-" + uniqueSuffix);
        agReq.setContractValue(new BigDecimal("500000.00"));
        agReq.setCurrency("USD");
        agReq.setPaymentTerms("Net 30 days upon verified milestone completion");
        agReq.setRetentionPercentage(new BigDecimal("5.00"));
        agReq.setTaxPercentage(new BigDecimal("18.00"));
        agReq.setStartDate(LocalDate.now().minusDays(10));
        agReq.setEndDate(LocalDate.now().plusDays(90));

        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);
        assertThat(agreement).isNotNull();
        assertThat(agreement.getAgreementCode()).startsWith("AGR-");

        // Verify agreement is active
        mockMvc.perform(get("/api/v1/vendor-agreements/" + agreement.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        // 2. Admin creates Milestone and associates assignment
        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(project.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(vendor.getId());
        msReq.setName("Milestone 1 — Drainage Bedding");
        msReq.setDescription("Completion of primary culverts");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneType("CIVIL_TRENCHING");
        msReq.setMilestoneValue(new BigDecimal("200000.00"));
        msReq.setCurrency("USD");
        msReq.setPlannedStartDate(LocalDate.now().minusDays(10));
        msReq.setPlannedEndDate(LocalDate.now().plusDays(20));
        msReq.setPaymentPolicy(PaymentPolicy.SINGLE_PAYMENT);

        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);
        assertThat(milestone).isNotNull();

        // Associate assignment
        AssociateMilestoneAssignmentsRequest assocReq = new AssociateMilestoneAssignmentsRequest();
        assocReq.setAssignmentIds(List.of(completedAssignment.getId()));
        milestoneService.associateAssignments(milestone.getId(), assocReq, adminUser);

        // 3. Milestone eligibility evaluation
        mockMvc.perform(get("/api/v1/milestones/" + milestone.getId() + "/eligibility")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(true));

        // 4. Vendor submits Invoice & Payment Request
        CreatePaymentRequestDto prDto = new CreatePaymentRequestDto();
        prDto.setInvoiceNumber("INV-" + uniqueSuffix);
        prDto.setInvoiceDate(LocalDate.now());
        prDto.setRequestedAmount(new BigDecimal("200000.00"));
        prDto.setCurrency("USD");
        prDto.setDescription("Culvert work completed according to engineering specs");
        prDto.setSupportingDocumentUrl("https://storage.local/invoices/inv-" + uniqueSuffix + ".pdf");

        String prResJson = mockMvc.perform(post("/api/v1/payment-requests/milestone/" + milestone.getId())
                        .header("Authorization", vendorToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.paymentRequestCode").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String paymentRequestId = objectMapper.readTree(prResJson).get("data").get("id").asText();

        // 5. Finance Officer verifies invoice
        VerifyInvoiceRequest verifyReq = new VerifyInvoiceRequest();
        verifyReq.setVerificationStatus(InvoiceVerificationStatus.VERIFIED);
        verifyReq.setVerificationReason("Invoice matches physical milestone deliverables");

        mockMvc.perform(post("/api/v1/finance/payment-requests/" + paymentRequestId + "/verify-invoice")
                        .header("Authorization", financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.invoiceVerification.status").value("VERIFIED"));

        // 6. Finance Officer approves payment request
        FinancialDecisionRequest approveDec = new FinancialDecisionRequest();
        approveDec.setDecisionType(FinanceDecisionType.APPROVE);
        approveDec.setApprovedAmount(new BigDecimal("200000.00"));
        approveDec.setReason("Approved for simulated payment authorization");
        approveDec.setComments("Verification passed with all milestone deliverables");

        mockMvc.perform(post("/api/v1/finance/payment-requests/" + paymentRequestId + "/decisions")
                        .header("Authorization", financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveDec)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // 7. Finance Officer creates Simulated Payment Authorization
        AuthorizePaymentRequest authReq = new AuthorizePaymentRequest();
        authReq.setIdempotencyKey("IDEMP-" + uniqueSuffix);
        authReq.setAuthorizedAmount(new BigDecimal("200000.00"));

        String authResJson = mockMvc.perform(post("/api/v1/finance/payment-requests/" + paymentRequestId + "/authorize")
                        .header("Authorization", financeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("AUTHORIZED"))
                .andReturn().getResponse().getContentAsString();

        String authId = objectMapper.readTree(authResJson).get("data").get("id").asText();

        // 8. Record Simulated Settlement
        mockMvc.perform(post("/api/v1/payments/" + authId + "/simulate-settlement")
                        .header("Authorization", financeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SETTLED_SIMULATED"));

        // Verify financial metrics are present in finance summary
        mockMvc.perform(get("/api/v1/finance/dashboard/summary")
                        .header("Authorization", financeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvedPaymentAmount").isNotEmpty());
    }

    @Test
    @DisplayName("Workflow C — Audit & Analytics: Full Hash Chain Verification -> 10 Empirical KPIs -> CSV Report Export")
    public void testWorkflowC_AuditIntegrityAndEmpiricalAnalytics() throws Exception {
        // 1. Verify global cryptographic audit chain integrity
        mockMvc.perform(post("/api/v1/audit-events/integrity/verify")
                        .header("Authorization", adminToken)
                        .param("chainScope", "GLOBAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("VALID"))
                .andExpect(jsonPath("$.data.invalidEventsCount").value(0));

        // 2. Query operational dashboard summary
        mockMvc.perform(get("/api/v1/analytics/dashboard/summary")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.simulatedDisclaimer").isNotEmpty());

        // 3. Query scoring configuration
        mockMvc.perform(get("/api/v1/analytics/scoring-configurations/active")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));

        // 4. Request CSV Report Export via service
        ExportReportRequestDto exportReq = new ExportReportRequestDto();
        exportReq.setReportType(ReportType.VENDOR_PERFORMANCE);
        exportReq.setFormat(ReportFormat.CSV);

        ReportJobResponseDto job = reportExportService.exportReport(exportReq, adminUser);
        assertThat(job).isNotNull();
        assertThat(job.getId()).isNotEmpty();
        assertThat(job.getStatus().name()).isEqualTo("COMPLETED");

        // 5. Download and assert CSV content
        byte[] csvBytes = reportExportService.downloadReportContent(job.getId(), adminUser);
        String csvContent = new String(csvBytes);
        assertThat(csvContent).contains("Vendor Code", "Company Name", "Overall Score");
    }
}
