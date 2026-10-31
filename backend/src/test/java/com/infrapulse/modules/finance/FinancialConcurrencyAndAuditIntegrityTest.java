package com.infrapulse.modules.finance;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditEvent;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.common.audit.AuditIntegrityReport;
import com.infrapulse.common.audit.AuditIntegrityService;
import com.infrapulse.common.audit.AuditIntegrityStatus;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.finance.dto.AuthorizePaymentRequest;
import com.infrapulse.modules.finance.dto.FinancialCalculationBreakdownDto;
import com.infrapulse.modules.finance.dto.PaymentAuthorizationResponse;
import com.infrapulse.modules.finance.entity.MilestoneWorkAssignment;
import com.infrapulse.modules.finance.entity.PaymentAuthorization;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import com.infrapulse.modules.finance.enums.PaymentPolicy;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.MilestoneVerificationRepository;
import com.infrapulse.modules.finance.repository.MilestoneWorkAssignmentRepository;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorAgreementRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.finance.service.PaymentAuthorizationService;
import com.infrapulse.modules.finance.service.PaymentValidationService;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.model.ReviewStatus;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class FinancialConcurrencyAndAuditIntegrityTest {

    @Autowired
    private PaymentValidationService paymentValidationService;

    @Autowired
    private PaymentAuthorizationService paymentAuthorizationService;

    @Autowired
    private AuditIntegrityService auditIntegrityService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditEventRepository auditEventRepository;

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
    private QualityInspectionTemplateRepository templateRepository;

    @Autowired
    private QualityAssessmentRepository qualityAssessmentRepository;

    @Autowired
    private HumanInspectionReviewRepository humanInspectionReviewRepository;

    @Autowired
    private HumanInspectionDecisionRepository humanInspectionDecisionRepository;

    @Autowired
    private VendorAgreementRepository agreementRepository;

    @Autowired
    private ProjectMilestoneRepository milestoneRepository;

    @Autowired
    private VendorPaymentRequestRepository paymentRequestRepository;

    @Autowired
    private PaymentAuthorizationRepository paymentAuthorizationRepository;

    @Autowired
    private MilestoneWorkAssignmentRepository milestoneWorkAssignmentRepository;

    @Autowired
    private MilestoneVerificationRepository milestoneVerificationRepository;

    private User financeAdmin;
    private User vendorUser;
    private Vendor vendor;
    private Project project;
    private WorkZone zone;
    private WorkAssignment assignment;
    private VendorAgreement agreement;
    private ProjectMilestone milestone;
    private String uniqueSuffix;

    @BeforeEach
    public void setUp() {
        uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        financeAdmin = new User();
        financeAdmin.setEmail("fin_adm_" + uniqueSuffix + "@infrapulse.test");
        financeAdmin.setFullName("Finance Admin");
        financeAdmin.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456");
        financeAdmin.setRole(UserRole.FINANCE_OFFICER);
        financeAdmin.setStatus(UserStatus.ACTIVE);
        financeAdmin = userRepository.save(financeAdmin);

        vendorUser = new User();
        vendorUser.setEmail("vnd_user_" + uniqueSuffix + "@vendor.test");
        vendorUser.setFullName("Vendor User");
        vendorUser.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456");
        vendorUser.setRole(UserRole.VENDOR);
        vendorUser.setStatus(UserStatus.ACTIVE);
        vendorUser = userRepository.save(vendorUser);

        project = new Project(
                UUID.randomUUID().toString(),
                "PRJ-FIN-" + uniqueSuffix,
                "Financial Test Project " + uniqueSuffix,
                "Financial verification project",
                ProjectType.ROAD_INFRASTRUCTURE,
                "Highways Authority",
                "Metro Center", "Karnataka", "Bengaluru", "560001",
                LocalDate.now(), LocalDate.now().plusMonths(6),
                new BigDecimal("5000000.00"), ProjectStatus.ACTIVE,
                financeAdmin, financeAdmin
        );
        project = projectRepository.save(project);

        zone = new WorkZone(
                UUID.randomUUID().toString(),
                "WZ-FIN-" + uniqueSuffix,
                project,
                "Financial Zone",
                "Sector 1",
                "560001",
                "Metro Center", "Bengaluru Urban", "Karnataka",
                BigDecimal.ZERO, BigDecimal.ZERO,
                ZoneStatus.ACTIVE, financeAdmin
        );
        zone = workZoneRepository.save(zone);

        vendor = new Vendor();
        vendor.setVendorCode("VND-FIN-" + uniqueSuffix);
        vendor.setCompanyName("Metro Build Corp " + uniqueSuffix);
        vendor.setContactPerson("Metro Rep");
        vendor.setEmail("metro_" + uniqueSuffix + "@build.com");
        vendor.setPhoneNumber("+919900112233");
        vendor.setAddressLine("Metro Line 1");
        vendor.setCity("Bengaluru");
        vendor.setDistrict("Bengaluru Urban");
        vendor.setState("Karnataka");
        vendor.setPincode("560001");
        vendor.setUser(vendorUser);
        vendor.setStatus(VendorStatus.ACTIVE);
        vendor.setServiceCategories(Set.of(ServiceCategory.ROAD_RESURFACING));
        vendor = vendorRepository.save(vendor);

        projectVendorRepository.save(new ProjectVendor(project, vendor, financeAdmin, "Approved Vendor"));

        agreement = new VendorAgreement();
        agreement.setAgreementCode("AGR-FIN-" + uniqueSuffix);
        agreement.setContractReference("CONT-FIN-" + uniqueSuffix);
        agreement.setProject(project);
        agreement.setVendor(vendor);
        agreement.setContractValue(new BigDecimal("1000000.00"));
        agreement.setCurrency("USD");
        agreement.setPaymentTerms("Net 30");
        agreement.setRetentionPercentage(new BigDecimal("5.00"));
        agreement.setTaxPercentage(new BigDecimal("18.00"));
        agreement.setStartDate(LocalDate.now().minusDays(10));
        agreement.setEndDate(LocalDate.now().plusDays(180));
        agreement.setStatus(AgreementStatus.ACTIVE);
        agreement.setCreatedBy(financeAdmin);
        agreement = agreementRepository.save(agreement);

        milestone = new ProjectMilestone();
        milestone.setMilestoneCode("MLS-FIN-" + uniqueSuffix);
        milestone.setName("Track Foundation Complete");
        milestone.setAgreement(agreement);
        milestone.setProject(project);
        milestone.setVendor(vendor);
        milestone.setMilestoneType("ROAD_RESURFACING");
        milestone.setMilestoneValue(new BigDecimal("250000.00"));
        milestone.setCurrency("USD");
        milestone.setSequenceNumber(1);
        milestone.setPlannedStartDate(LocalDate.now());
        milestone.setPlannedEndDate(LocalDate.now().plusDays(30));
        milestone.setPaymentPolicy(PaymentPolicy.SINGLE_PAYMENT);
        milestone.setStatus(MilestoneStatus.ELIGIBLE_FOR_PAYMENT);
        milestone.setCreatedBy(financeAdmin);
        milestone = milestoneRepository.save(milestone);

        // Associated completed and quality-approved work assignment to satisfy eligibility
        assignment = new WorkAssignment();
        assignment.setId(UUID.randomUUID().toString());
        assignment.setAssignmentCode("WA-FIN-" + uniqueSuffix);
        assignment.setTitle("Road Resurfacing Section 1");
        assignment.setProject(project);
        assignment.setWorkZone(zone);
        assignment.setVendor(vendor);
        assignment.setWorkType(WorkType.ROAD_RESURFACING);
        assignment.setPriority(AssignmentPriority.HIGH);
        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setReleaseStatus(ReleaseStatus.RELEASED);
        assignment.setPlannedStartDate(LocalDate.now().minusDays(20));
        assignment.setTargetEndDate(LocalDate.now().minusDays(2));
        assignment.setCreatedBy(financeAdmin);
        assignment = workAssignmentRepository.save(assignment);

        MilestoneWorkAssignment mwa = new MilestoneWorkAssignment(milestone, assignment);
        milestoneWorkAssignmentRepository.save(mwa);

        QualityInspectionTemplate template = new QualityInspectionTemplate();
        template.setTemplateCode("TMPL-FIN-" + uniqueSuffix);
        template.setName("Resurfacing Template");
        template.setWorkType(WorkType.ROAD_RESURFACING);
        template.setVersion("1.0.0");
        template.setActive(true);
        template = templateRepository.save(template);

        QualityAssessment qa = new QualityAssessment();
        qa.setAssessmentCode("QA-FIN-" + uniqueSuffix);
        qa.setAssignment(assignment);
        qa.setTemplate(template);
        qa.setStatus(AssessmentStatus.PASS);
        qa.setTotalCriteriaEvaluated(2);
        qa.setPassedCriteriaCount(2);
        qa.setEvidenceCompletenessScore(100.0);
        qa = qualityAssessmentRepository.save(qa);

        HumanInspectionReview hir = new HumanInspectionReview();
        hir.setReviewCode("HIR-FIN-" + uniqueSuffix);
        hir.setAssignment(assignment);
        hir.setAssessment(qa);
        hir.setReviewStatus(ReviewStatus.COMPLETED);
        hir = humanInspectionReviewRepository.save(hir);

        HumanInspectionDecision hid = new HumanInspectionDecision();
        hid.setReview(hir);
        hid.setAssessment(qa);
        hid.setAssignment(assignment);
        hid.setDecisionType(ReviewDecisionType.APPROVED);
        hid.setReviewer(financeAdmin);
        hid.setReviewerRole("QUALITY_INSPECTOR");
        hid.setReason("Passed quality audit");
        hid.setDecidedAt(Instant.now());
        humanInspectionDecisionRepository.save(hid);
    }

    @AfterEach
    public void tearDown() {
        paymentAuthorizationRepository.deleteAll();
        paymentRequestRepository.deleteAll();
        milestoneWorkAssignmentRepository.deleteAll();
        milestoneVerificationRepository.deleteAll();
        humanInspectionDecisionRepository.deleteAll();
        humanInspectionReviewRepository.deleteAll();
        qualityAssessmentRepository.deleteAll();
        templateRepository.deleteAll();
        workAssignmentRepository.deleteAll();
        workZoneRepository.deleteAll();
        milestoneRepository.deleteAll();
        agreementRepository.deleteAll();
        projectVendorRepository.deleteAll();
        vendorRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // 1. FINANCIAL CALCULATION PRECISION & INTEGRITY
    // ==========================================

    @Test
    @DisplayName("Financial Math: Strict BigDecimal Arithmetic and Exact Rounding")
    public void testFinancialCalculationPrecisionAndRounding() {
        BigDecimal requestedAmount = new BigDecimal("100000.00");
        FinancialCalculationBreakdownDto breakdown = paymentValidationService.calculateBreakdown(
                requestedAmount,
                milestone,
                agreement
        );

        assertThat(breakdown).isNotNull();
        // 5% Retention on 100,000.00 = 5,000.00
        assertThat(breakdown.getRetentionAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        // 18% Tax on 100,000.00 = 18,000.00
        assertThat(breakdown.getTaxAmount()).isEqualByComparingTo(new BigDecimal("18000.00"));
        // Net Payable = 100,000.00 - 5,000.00 + 18,000.00 = 113,000.00
        assertThat(breakdown.getNetPayableAmount()).isEqualByComparingTo(new BigDecimal("113000.00"));
        // Scale must strictly be 2 decimal places
        assertThat(breakdown.getNetPayableAmount().scale()).isEqualTo(2);
    }

    @Test
    @Transactional
    @DisplayName("Financial Validation: Negative and Zero Requested Amounts Rejected")
    public void testNegativeAndZeroAmountPaymentRequestsRejected() {
        // Zero amount
        assertThatThrownBy(() -> paymentValidationService.validatePaymentRequestSubmission(
                milestone, vendor, "INV-ZERO-1", LocalDate.now(), BigDecimal.ZERO, "USD"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Requested amount must be greater than zero");

        // Negative amount
        assertThatThrownBy(() -> paymentValidationService.validatePaymentRequestSubmission(
                milestone, vendor, "INV-NEG-1", LocalDate.now(), new BigDecimal("-500.00"), "USD"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Requested amount must be greater than zero");
    }

    @Test
    @Transactional
    @DisplayName("Financial Validation: Duplicate Invoice Number for Same Project & Vendor Blocked")
    public void testDuplicateInvoiceNumberRejectedWithConflict() {
        // Create initial payment request
        VendorPaymentRequest pr1 = new VendorPaymentRequest();
        pr1.setPaymentRequestCode("PRQ-DUP-1-" + uniqueSuffix);
        pr1.setProject(project);
        pr1.setAgreement(agreement);
        pr1.setMilestone(milestone);
        pr1.setVendor(vendor);
        pr1.setInvoiceNumber("INV-DUP-1001");
        pr1.setInvoiceDate(LocalDate.now());
        pr1.setRequestedAmount(new BigDecimal("250000.00"));
        pr1.setCurrency("USD");
        pr1.setStatus(PaymentRequestStatus.SUBMITTED);
        pr1.setCreatedBy(vendorUser);
        paymentRequestRepository.save(pr1);

        // Submitting second payment request with identical invoice number must throw 409 Conflict
        assertThatThrownBy(() -> paymentValidationService.validatePaymentRequestSubmission(
                milestone, vendor, "INV-DUP-1001", LocalDate.now(), new BigDecimal("250000.00"), "USD"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("already been submitted");
                });
    }

    @Test
    @Transactional
    @DisplayName("Financial Validation: Overpayment Exceeding Milestone Balance Rejected")
    public void testOverpaymentExceedingMilestoneBalanceRejected() {
        BigDecimal overAmount = new BigDecimal("300000.00"); // Milestone is only 250,000.00

        assertThatThrownBy(() -> paymentValidationService.validatePaymentRequestSubmission(
                milestone, vendor, "INV-OVER-1", LocalDate.now(), overAmount, "USD"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("exceeds remaining milestone balance");
    }

    // ==========================================
    // 2. CONCURRENCY & IDEMPOTENCY
    // ==========================================

    @Test
    @DisplayName("Financial Concurrency: Idempotency Key Prevents Duplicate Payment Authorizations")
    public void testIdempotentPaymentAuthorizationPreventsDoubleSpending() {
        // Create an approved payment request
        VendorPaymentRequest pr = new VendorPaymentRequest();
        pr.setPaymentRequestCode("PRQ-AUTH-" + uniqueSuffix);
        pr.setProject(project);
        pr.setAgreement(agreement);
        pr.setMilestone(milestone);
        pr.setVendor(vendor);
        pr.setInvoiceNumber("INV-AUTH-" + uniqueSuffix);
        pr.setInvoiceDate(LocalDate.now());
        pr.setRequestedAmount(new BigDecimal("250000.00"));
        pr.setCurrency("USD");
        pr.setStatus(PaymentRequestStatus.APPROVED);
        pr.setCreatedBy(vendorUser);
        pr = paymentRequestRepository.save(pr);

        String sharedIdempotencyKey = "IDEMP-TEST-KEY-" + uniqueSuffix;

        // Simulate pre-existing authorization created by concurrent worker
        PaymentAuthorization existingAuth = new PaymentAuthorization();
        existingAuth.setId(UUID.randomUUID().toString());
        existingAuth.setPaymentCode("PAY-IDEMP-" + uniqueSuffix);
        existingAuth.setPaymentRequest(pr);
        existingAuth.setMilestone(milestone);
        existingAuth.setProject(project);
        existingAuth.setVendor(vendor);
        existingAuth.setAuthorizedAmount(new BigDecimal("250000.00"));
        existingAuth.setCurrency("USD");
        existingAuth.setStatus(PaymentAuthorizationStatus.AUTHORIZED);
        existingAuth.setAuthorizationReference("AUTH-REF-" + uniqueSuffix);
        existingAuth.setIdempotencyKey(sharedIdempotencyKey);
        existingAuth.setAuthorizedBy(financeAdmin);
        existingAuth = paymentAuthorizationRepository.save(existingAuth);

        AuthorizePaymentRequest authReq = new AuthorizePaymentRequest();
        authReq.setIdempotencyKey(sharedIdempotencyKey);
        authReq.setAuthorizedAmount(new BigDecimal("250000.00"));

        // Re-submission with identical idempotencyKey (concurrency / replay attempt)
        PaymentAuthorizationResponse response = paymentAuthorizationService.authorizePayment(
                pr.getId(), authReq, financeAdmin
        );

        // Must return the exact same payment record without creating duplicates
        assertThat(response.getId()).isEqualTo(existingAuth.getId());
        assertThat(response.getPaymentCode()).isEqualTo(existingAuth.getPaymentCode());
        assertThat(response.getAuthorizedAmount()).isEqualByComparingTo(new BigDecimal("250000.00"));

        // Verify database contains strictly 1 authorization record, NOT 2
        long count = paymentAuthorizationRepository.count();
        assertThat(count).isEqualTo(1);
    }

    // ==========================================
    // 3. CRYPTOGRAPHIC AUDIT CHAIN INTEGRITY & TAMPER DETECTION
    // ==========================================

    @Test
    @DisplayName("Audit Chain Security: Valid Chain Reports Integrity Status VALID")
    public void testAuditChainIntactVerification() {
        String testScope = "TEST_CHAIN_" + uniqueSuffix;

        auditService.recordEvent(
                "TEST_EVENT_1", AuditCategory.FINANCIAL_WORKFLOW, "PROJECT", project.getId(),
                "PRJ-REF", project.getId(), vendor.getId(), "CREATE", AuditOutcome.SUCCESS,
                "Initial creation event", financeAdmin.getId(), financeAdmin.getFullName(),
                financeAdmin.getRole().name(), "{\"action\":\"initial\"}", testScope
        );

        auditService.recordEvent(
                "TEST_EVENT_2", AuditCategory.FINANCIAL_WORKFLOW, "PROJECT", project.getId(),
                "PRJ-REF", project.getId(), vendor.getId(), "UPDATE", AuditOutcome.SUCCESS,
                "Update creation event", financeAdmin.getId(), financeAdmin.getFullName(),
                financeAdmin.getRole().name(), "{\"action\":\"updated\"}", testScope
        );

        AuditIntegrityReport report = auditIntegrityService.verifyChain(testScope);
        assertThat(report.getStatus()).isEqualTo(AuditIntegrityStatus.VALID);
        assertThat(report.getTotalEventsChecked()).isEqualTo(2);
        assertThat(report.getValidEventsCount()).isEqualTo(2);
        assertThat(report.getInvalidEventsCount()).isEqualTo(0);
        assertThat(report.getViolations()).isEmpty();
    }

    @Test
    @DisplayName("Audit Tamper Detection: Payload Modification Fails Cryptographic Verification")
    public void testTamperedAuditPayloadDetectedAndFlagged() {
        String testScope = "TAMPER_PAYLOAD_" + uniqueSuffix;

        AuditEvent event = auditService.recordEvent(
                "SEC_AUDIT_1", AuditCategory.FINANCIAL_WORKFLOW, "PAYMENT", "PAY-1",
                "PAY-REF", project.getId(), vendor.getId(), "AUTHORIZE", AuditOutcome.SUCCESS,
                "Payment authorization", financeAdmin.getId(), financeAdmin.getFullName(),
                financeAdmin.getRole().name(), "{\"amount\": 1000}", testScope
        );

        // Before tampering: verification passes
        assertThat(auditIntegrityService.verifySingleEvent(event)).isTrue();

        // Adversary alters the persisted payload in the database
        event.setEventPayload("{\"amount\": 9999999}"); // Tampered payload
        auditEventRepository.save(event);

        // After tampering: verification must fail
        assertThat(auditIntegrityService.verifySingleEvent(event)).isFalse();

        // Chain verification must flag status as INVALID and report violations
        AuditIntegrityReport report = auditIntegrityService.verifyChain(testScope);
        assertThat(report.getStatus()).isEqualTo(AuditIntegrityStatus.INVALID);
        assertThat(report.getInvalidEventsCount()).isGreaterThanOrEqualTo(1);
        assertThat(report.getViolations()).isNotEmpty();
    }

    @Test
    @DisplayName("Audit Tamper Detection: Forged Hash Modification Detected")
    public void testTamperedAuditHashDetected() {
        String testScope = "TAMPER_HASH_" + uniqueSuffix;

        AuditEvent event = auditService.recordEvent(
                "SEC_AUDIT_2", AuditCategory.FINANCIAL_WORKFLOW, "PAYMENT", "PAY-2",
                "PAY-REF", project.getId(), vendor.getId(), "AUTHORIZE", AuditOutcome.SUCCESS,
                "Payment authorization", financeAdmin.getId(), financeAdmin.getFullName(),
                financeAdmin.getRole().name(), "{\"status\": \"APPROVED\"}", testScope
        );

        // Adversary modifies the stored event hash
        event.setEventHash("00000000000000000000000000000000000000000000000000000000fakehash");
        auditEventRepository.save(event);

        // Must fail single event verification
        assertThat(auditIntegrityService.verifySingleEvent(event)).isFalse();

        // Chain verification must flag invalid status
        AuditIntegrityReport report = auditIntegrityService.verifyChain(testScope);
        assertThat(report.getStatus()).isEqualTo(AuditIntegrityStatus.INVALID);
    }
}
