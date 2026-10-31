package com.infrapulse.modules.finance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import com.infrapulse.modules.finance.enums.FinanceDecisionType;
import com.infrapulse.modules.finance.enums.InvoiceVerificationStatus;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import com.infrapulse.modules.finance.enums.PaymentPolicy;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.finance.repository.VendorAgreementRepository;
import com.infrapulse.modules.finance.repository.VendorPaymentRequestRepository;
import com.infrapulse.modules.finance.service.*;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.HumanInspectionDecision;
import com.infrapulse.modules.humanreview.entity.HumanInspectionReview;
import com.infrapulse.modules.humanreview.entity.PhysicalMeasurement;
import com.infrapulse.modules.humanreview.model.*;
import com.infrapulse.modules.humanreview.repository.*;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class FinanceWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
    private WorkAssignmentRepository workAssignmentRepository;

    @Autowired
    private QualityInspectionTemplateRepository templateRepository;

    @Autowired
    private QualityAssessmentRepository assessmentRepository;

    @Autowired
    private HumanInspectionReviewRepository reviewRepository;

    @Autowired
    private HumanInspectionDecisionRepository decisionRepository;

    @Autowired
    private CorrectiveActionRepository correctiveActionRepository;

    @Autowired
    private PhysicalMeasurementRepository measurementRepository;

    @Autowired
    private VendorAgreementRepository agreementRepository;

    @Autowired
    private ProjectMilestoneRepository milestoneRepository;

    @Autowired
    private VendorPaymentRequestRepository paymentRequestRepository;

    @Autowired
    private PaymentAuthorizationRepository authorizationRepository;

    @Autowired
    private VendorAgreementService agreementService;

    @Autowired
    private ProjectMilestoneService milestoneService;

    @Autowired
    private MilestoneEligibilityService eligibilityService;

    @Autowired
    private PaymentValidationService paymentValidationService;

    @Autowired
    private VendorPaymentRequestService paymentRequestService;

    @Autowired
    private FinanceApprovalService financeApprovalService;

    @Autowired
    private PaymentAuthorizationService paymentAuthorizationService;

    @Autowired
    private FinanceDashboardService financeDashboardService;

    private User adminUser;
    private User pmUser;
    private User vendorUser;
    private User financeUser;
    private User inspectorUser;

    private String adminToken;
    private String pmToken;
    private String vendorToken;
    private String financeToken;
    private String inspectorToken;

    private Project testProject;
    private Vendor testVendor;
    private WorkZone testZone;
    private QualityInspectionTemplate testTemplate;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Finance Admin",
                "fin_admin_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543210",
                UserRole.PLATFORM_ADMIN,
                UserStatus.ACTIVE
        ));

        pmUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Finance PM",
                "fin_pm_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543211",
                UserRole.PROJECT_MANAGER,
                UserStatus.ACTIVE
        ));

        vendorUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Apex Vendor",
                "apex_vnd_" + UUID.randomUUID() + "@vendor.com",
                passwordEncoder.encode("Password@123"),
                "+919876543212",
                UserRole.VENDOR,
                UserStatus.ACTIVE
        ));

        financeUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Chief Finance Officer",
                "cfo_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543213",
                UserRole.FINANCE_OFFICER,
                UserStatus.ACTIVE
        ));

        inspectorUser = userRepository.save(new User(
                UUID.randomUUID().toString(),
                "Field Inspector",
                "insp_" + UUID.randomUUID() + "@infrapulse.gov.in",
                passwordEncoder.encode("Password@123"),
                "+919876543214",
                UserRole.FIELD_ENGINEER,
                UserStatus.ACTIVE
        ));

        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminUser);
        pmToken = "Bearer " + jwtTokenProvider.generateAccessToken(pmUser);
        vendorToken = "Bearer " + jwtTokenProvider.generateAccessToken(vendorUser);
        financeToken = "Bearer " + jwtTokenProvider.generateAccessToken(financeUser);
        inspectorToken = "Bearer " + jwtTokenProvider.generateAccessToken(inspectorUser);

        testVendor = new Vendor();
        testVendor.setVendorCode("VND-S12-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        testVendor.setCompanyName("Apex Utility Infra Ltd");
        testVendor.setContactPerson("Apex Rep");
        testVendor.setEmail("contact@apexinfra.com");
        testVendor.setPhoneNumber("+919876543210");
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

        testProject = new Project(
                UUID.randomUUID().toString(),
                "PRJ-S12-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(),
                "Smart Metro Fiber Corridor - Stage 12",
                "Telecom Optical Fiber Expansion",
                ProjectType.FIBER_OPTIC,
                "State Telecom",
                "South", "Karnataka", "Bengaluru Urban", "560001",
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(180),
                BigDecimal.valueOf(5000000), ProjectStatus.ACTIVE,
                adminUser, pmUser
        );
        testProject = projectRepository.save(testProject);

        ProjectVendor pv = new ProjectVendor(testProject, testVendor, pmUser, "Authorized vendor for corridor");
        projectVendorRepository.save(pv);

        testZone = new WorkZone(
                UUID.randomUUID().toString(),
                "WZ-S12-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(),
                testProject,
                "Zone 1 Whitefield",
                "Whitefield Sector",
                "560066",
                "Whitefield", "Bengaluru Urban", "Karnataka",
                BigDecimal.valueOf(12.9716), BigDecimal.valueOf(77.5946),
                ZoneStatus.ACTIVE, adminUser
        );
        testZone = workZoneRepository.save(testZone);

        testTemplate = new QualityInspectionTemplate();
        testTemplate.setTemplateCode("TMPL-S12-" + UUID.randomUUID().toString().substring(0, 6));
        testTemplate.setWorkType(WorkType.TRENCHING);
        testTemplate.setVersion("1.0.0");
        testTemplate.setName("Standard Trenching Inspection Protocol");
        testTemplate.setDescription("Stage 12 test template");
        testTemplate.setActive(true);
        testTemplate = templateRepository.save(testTemplate);
    }

    @Test
    @DisplayName("Stage 12 E2E Positive Scenario: Trenching milestone approved and simulated payment authorized & settled")
    void testEndToEndTrenchingMilestonePaymentAuthorization() throws Exception {
        // Step 1: Create active vendor commercial agreement
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-METRO-2026-001");
        agReq.setContractValue(new BigDecimal("100000.00"));
        agReq.setCurrency("USD");
        agReq.setPaymentTerms("Net 30 days upon verified milestone completion");
        agReq.setRetentionPercentage(new BigDecimal("5.00")); // 5% retention
        agReq.setTaxPercentage(new BigDecimal("18.00"));      // 18% GST
        agReq.setStartDate(LocalDate.now().minusDays(10));
        agReq.setEndDate(LocalDate.now().plusDays(90));

        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);
        assertThat(agreement).isNotNull();
        assertThat(agreement.getAgreementCode()).startsWith("AGR-");
        assertThat(agreement.getContractValue()).isEqualByComparingTo("100000.00");
        assertThat(agreement.getCurrentVersion()).isEqualTo(1);

        // Step 2: Create Trenching Milestone
        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(testProject.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(testVendor.getId());
        msReq.setName("Trenching Completion - Sector 4");
        msReq.setDescription("Excavation and trenching along Sector 4 arterial road");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneType("CIVIL_TRENCHING");
        msReq.setMilestoneValue(new BigDecimal("25000.00"));
        msReq.setCurrency("USD");
        msReq.setPlannedStartDate(LocalDate.now().minusDays(10));
        msReq.setPlannedEndDate(LocalDate.now().plusDays(10));
        msReq.setPaymentPolicy(PaymentPolicy.SINGLE_PAYMENT);

        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);
        assertThat(milestone).isNotNull();
        assertThat(milestone.getMilestoneCode()).startsWith("MLS-");
        assertThat(milestone.getStatus()).isEqualTo(MilestoneStatus.DRAFT);

        // Step 3: Create and associate Trenching Work Assignment
        WorkAssignment assignment = new WorkAssignment();
        assignment.setId(UUID.randomUUID().toString());
        assignment.setCreatedBy(adminUser);
        assignment.setAssignmentCode("ASN-TR-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        assignment.setProject(testProject);
        assignment.setWorkZone(testZone);
        assignment.setVendor(testVendor);
        assignment.setWorkType(WorkType.TRENCHING);
        assignment.setTitle("Dig Trench for Cable Conduit");
        assignment.setPlannedStartDate(LocalDate.now().minusDays(5));
        assignment.setTargetEndDate(LocalDate.now().plusDays(5));
        assignment.setPriority(AssignmentPriority.HIGH);
        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setReleaseStatus(ReleaseStatus.RELEASED);
        assignment = workAssignmentRepository.save(assignment);

        AssociateMilestoneAssignmentsRequest assocReq = new AssociateMilestoneAssignmentsRequest();
        assocReq.setAssignmentIds(List.of(assignment.getId()));
        milestoneService.associateAssignments(milestone.getId(), assocReq, adminUser);

        // Negative check before quality & inspection approval: Must be INELIGIBLE
        MilestoneEligibilityResponse preElig = eligibilityService.evaluateMilestoneEligibility(milestone.getId(), adminUser);
        assertThat(preElig.isEligible()).isFalse();
        assertThat(preElig.getBlockingConditions()).isNotEmpty();

        // Step 4: Add Stage 10 Quality Assessment (PASS)
        QualityAssessment qa = new QualityAssessment();
        qa.setAssessmentCode("QA-TR-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        qa.setAssignment(assignment);
        qa.setTemplate(testTemplate);
        qa.setStatus(AssessmentStatus.PASS);
        qa.setEvidenceCompletenessScore(95.0);
        qa.setTotalCriteriaEvaluated(4);
        qa.setPassedCriteriaCount(4);
        qa = assessmentRepository.save(qa);

        // Add Physical Measurement (VERIFIED_PASS)
        PhysicalMeasurement pm = new PhysicalMeasurement();
        pm.setMeasurementCode("MEAS-TR-001");
        pm.setAssessment(qa);
        pm.setMeasurementType(PhysicalMeasurementType.TRENCH_DEPTH);
        pm.setMeasuredValue(1.25);
        pm.setUnit(MeasurementUnit.METERS);
        pm.setInspector(inspectorUser);
        pm.setVerificationStatus(MeasurementVerificationStatus.VERIFIED_PASS);
        measurementRepository.save(pm);

        // Add Human Inspection Review & APPROVED Decision
        HumanInspectionReview review = new HumanInspectionReview();
        review.setReviewCode("HIR-TR-001");
        review.setAssessment(qa);
        review.setAssignment(assignment);
        review.setReviewer(inspectorUser);
        review.setReviewStatus(ReviewStatus.COMPLETED);
        review = reviewRepository.save(review);

        HumanInspectionDecision decision = new HumanInspectionDecision();
        decision.setReview(review);
        decision.setAssessment(qa);
        decision.setAssignment(assignment);
        decision.setReviewer(inspectorUser);
        decision.setReviewerRole("FIELD_ENGINEER");
        decision.setDecisionType(ReviewDecisionType.APPROVED);
        decision.setReason("Trench dimensions compliant with specifications. Compaction and safety barriers intact.");
        decisionRepository.save(decision);

        // Step 5: Evaluate Milestone Eligibility
        MilestoneEligibilityResponse postElig = eligibilityService.evaluateMilestoneEligibility(milestone.getId(), adminUser);
        assertThat(postElig.isEligible()).isTrue();
        assertThat(postElig.getBlockingConditions()).isEmpty();
        assertThat(postElig.getChecklist().get("STAGE11_HUMAN_INSPECTION_APPROVED")).isTrue();

        // Refresh milestone status
        ProjectMilestone dbMilestone = milestoneRepository.findById(milestone.getId()).orElseThrow();
        assertThat(dbMilestone.getStatus()).isEqualTo(MilestoneStatus.ELIGIBLE_FOR_PAYMENT);

        // Step 6: Vendor Submits Payment Request
        CreatePaymentRequestDto prDto = new CreatePaymentRequestDto();
        prDto.setInvoiceNumber("INV-2026-TR-001");
        prDto.setInvoiceDate(LocalDate.now());
        prDto.setRequestedAmount(new BigDecimal("25000.00"));
        prDto.setCurrency("USD");
        prDto.setDescription("Final invoice for trenching completion Sector 4");
        prDto.setSupportingDocumentUrl("https://storage.infrapulse.gov.in/invoices/inv-001.pdf");

        CreatePaymentRequestDto.DocumentAttachmentDto doc = new CreatePaymentRequestDto.DocumentAttachmentDto();
        doc.setDocumentName("Trenching Measurement Sheet");
        doc.setEvidenceOrDocumentReference("EVID-TR-MEAS-001");
        prDto.setSupportingDocuments(List.of(doc));

        VendorPaymentRequestResponse prResp = paymentRequestService.submitPaymentRequest(milestone.getId(), prDto, vendorUser);
        assertThat(prResp).isNotNull();
        assertThat(prResp.getPaymentRequestCode()).startsWith("PRQ-");
        assertThat(prResp.getStatus()).isEqualTo(PaymentRequestStatus.SUBMITTED);
        assertThat(prResp.getRequestedAmount()).isEqualByComparingTo("25000.00");
        assertThat(prResp.getCalculationBreakdown()).isNotNull();

        // Step 7: Verify Calculation Breakdown
        // Base: 25,000, Retention 5% = 1,250, Tax 18% = 4,500
        // Net payable = 25000 - 1250 + 4500 = 28250.00
        FinancialCalculationBreakdownDto calc = prResp.getCalculationBreakdown();
        assertThat(calc.getRetentionAmount()).isEqualByComparingTo("1250.00");
        assertThat(calc.getTaxAmount()).isEqualByComparingTo("4500.00");
        assertThat(calc.getNetPayableAmount()).isEqualByComparingTo("28250.00");

        // Step 8: Finance Reviewer Verifies Invoice
        VerifyInvoiceRequest viReq = new VerifyInvoiceRequest();
        viReq.setVerificationStatus(InvoiceVerificationStatus.VERIFIED);
        viReq.setVerificationReason("GSTIN and PAN verified, measurement sheets cross-referenced");

        VendorPaymentRequestResponse verifiedPr = financeApprovalService.verifyInvoice(prResp.getId(), viReq, financeUser);
        assertThat(verifiedPr.getStatus()).isEqualTo(PaymentRequestStatus.UNDER_FINANCIAL_REVIEW);

        // Step 9: Finance Approves Payment Request
        FinancialDecisionRequest decReq = new FinancialDecisionRequest();
        decReq.setDecisionType(FinanceDecisionType.APPROVE);
        decReq.setReason("All engineering inspection approvals verified. Milestone balance sufficient.");
        decReq.setApprovedAmount(new BigDecimal("25000.00"));

        VendorPaymentRequestResponse approvedPr = financeApprovalService.recordDecision(prResp.getId(), decReq, financeUser);
        assertThat(approvedPr.getStatus()).isEqualTo(PaymentRequestStatus.APPROVED);

        ProjectMilestone approvedMs = milestoneRepository.findById(milestone.getId()).orElseThrow();
        assertThat(approvedMs.getStatus()).isEqualTo(MilestoneStatus.PAYMENT_APPROVED);

        // Step 10: Authorize Simulated Payment
        AuthorizePaymentRequest authReq = new AuthorizePaymentRequest();
        authReq.setIdempotencyKey(UUID.randomUUID().toString());
        authReq.setAuthorizedAmount(new BigDecimal("25000.00"));

        PaymentAuthorizationResponse authResp = paymentAuthorizationService.authorizePayment(approvedPr.getId(), authReq, financeUser);
        assertThat(authResp).isNotNull();
        assertThat(authResp.getPaymentCode()).startsWith("PAY-");
        assertThat(authResp.getStatus()).isEqualTo(PaymentAuthorizationStatus.AUTHORIZED);
        assertThat(authResp.getSimulationDisclaimer()).contains("SIMULATED PAYMENT — NO REAL FUNDS TRANSFERRED");
        assertThat(authResp.getTransactions()).isNotEmpty();

        // Step 11: Simulate Settlement
        PaymentAuthorizationResponse settledResp = paymentAuthorizationService.simulateSettlement(authResp.getId(), financeUser);
        assertThat(settledResp.getStatus()).isEqualTo(PaymentAuthorizationStatus.SETTLED_SIMULATED);
        assertThat(settledResp.getSettledAt()).isNotNull();

        ProjectMilestone paidMs = milestoneRepository.findById(milestone.getId()).orElseThrow();
        assertThat(paidMs.getStatus()).isEqualTo(MilestoneStatus.PAID);

        // Step 12: Verify Dashboard Summary
        FinanceDashboardSummaryResponse dashboard = financeDashboardService.getDashboardSummary();
        assertThat(dashboard.getTotalContractualValue()).isGreaterThanOrEqualTo(new BigDecimal("100000.00"));
        assertThat(dashboard.getApprovedPaymentAmount()).isGreaterThanOrEqualTo(new BigDecimal("25000.00"));
        assertThat(dashboard.getSimulatedSettledAmount()).isGreaterThanOrEqualTo(new BigDecimal("25000.00"));
    }

    @Test
    @DisplayName("Negative Scenario 1: Unapproved work assignment blocks milestone eligibility")
    void testUnapprovedWorkBlocksEligibility() {
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-NEG-1");
        agReq.setContractValue(new BigDecimal("50000.00"));
        agReq.setStartDate(LocalDate.now().minusDays(5));
        agReq.setEndDate(LocalDate.now().plusDays(60));
        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);

        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(testProject.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(testVendor.getId());
        msReq.setName("Cable Pulling Stage");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneValue(new BigDecimal("15000.00"));
        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);

        // Assignment is only IN_PROGRESS, not COMPLETED/RELEASED
        WorkAssignment assignment = new WorkAssignment();
        assignment.setId(UUID.randomUUID().toString());
        assignment.setCreatedBy(adminUser);
        assignment.setAssignmentCode("ASN-NEG-01");
        assignment.setProject(testProject);
        assignment.setWorkZone(testZone);
        assignment.setVendor(testVendor);
        assignment.setWorkType(WorkType.UNDERGROUND_CABLE_INSTALLATION);
        assignment.setTitle("Pull Fiber Cable");
        assignment.setPlannedStartDate(LocalDate.now().minusDays(2));
        assignment.setTargetEndDate(LocalDate.now().plusDays(2));
        assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        assignment.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
        assignment = workAssignmentRepository.save(assignment);

        AssociateMilestoneAssignmentsRequest assocReq = new AssociateMilestoneAssignmentsRequest();
        assocReq.setAssignmentIds(List.of(assignment.getId()));
        milestoneService.associateAssignments(milestone.getId(), assocReq, adminUser);

        MilestoneEligibilityResponse resp = eligibilityService.evaluateMilestoneEligibility(milestone.getId(), adminUser);
        assertThat(resp.isEligible()).isFalse();
        assertThat(resp.getBlockingConditions().stream().anyMatch(c -> c.contains("COMPLETED status required"))).isTrue();
    }

    @Test
    @DisplayName("Negative Scenario 2: Unresolved mandatory corrective action blocks eligibility")
    void testOpenCorrectiveActionBlocksEligibility() {
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-NEG-2");
        agReq.setContractValue(new BigDecimal("80000.00"));
        agReq.setStartDate(LocalDate.now().minusDays(5));
        agReq.setEndDate(LocalDate.now().plusDays(60));
        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);

        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(testProject.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(testVendor.getId());
        msReq.setName("Road Resurfacing Section A");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneValue(new BigDecimal("20000.00"));
        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);

        WorkAssignment assignment = new WorkAssignment();
        assignment.setId(UUID.randomUUID().toString());
        assignment.setCreatedBy(adminUser);
        assignment.setAssignmentCode("ASN-NEG-02");
        assignment.setProject(testProject);
        assignment.setWorkZone(testZone);
        assignment.setVendor(testVendor);
        assignment.setWorkType(WorkType.ROAD_RESURFACING);
        assignment.setTitle("Bitumen Laying");
        assignment.setPlannedStartDate(LocalDate.now().minusDays(2));
        assignment.setTargetEndDate(LocalDate.now().plusDays(2));
        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setReleaseStatus(ReleaseStatus.RELEASED);
        assignment = workAssignmentRepository.save(assignment);

        AssociateMilestoneAssignmentsRequest assocReq = new AssociateMilestoneAssignmentsRequest();
        assocReq.setAssignmentIds(List.of(assignment.getId()));
        milestoneService.associateAssignments(milestone.getId(), assocReq, adminUser);

        QualityAssessment qa = new QualityAssessment();
        qa.setAssessmentCode("QA-NEG-02");
        qa.setAssignment(assignment);
        qa.setTemplate(testTemplate);
        qa.setStatus(AssessmentStatus.REQUIRES_HUMAN_REVIEW);
        qa = assessmentRepository.save(qa);

        // Human inspector APPROVED, BUT an open corrective action was issued!
        HumanInspectionReview review = new HumanInspectionReview();
        review.setReviewCode("HIR-NEG-02");
        review.setAssessment(qa);
        review.setAssignment(assignment);
        review.setReviewStatus(ReviewStatus.COMPLETED);
        review = reviewRepository.save(review);

        HumanInspectionDecision dec = new HumanInspectionDecision();
        dec.setReview(review);
        dec.setAssessment(qa);
        dec.setAssignment(assignment);
        dec.setReviewer(inspectorUser);
        dec.setReviewerRole("FIELD_ENGINEER");
        dec.setDecisionType(ReviewDecisionType.APPROVED);
        dec.setReason("Approved subject to closure of surface smoothing corrective action");
        decisionRepository.save(dec);

        // Open corrective action
        CorrectiveAction ca = new CorrectiveAction();
        ca.setActionCode("CA-NEG-02");
        ca.setAssessment(qa);
        ca.setAssignment(assignment);
        ca.setVendor(testVendor);
        ca.setActionType(CorrectiveActionType.REPAIR_OR_REWORK);
        ca.setDescription("Repave asphalt undulations near intersection");
        ca.setStatus(CorrectiveActionStatus.OPEN);
        ca.setCreatedBy(adminUser);
        correctiveActionRepository.save(ca);

        MilestoneEligibilityResponse resp = eligibilityService.evaluateMilestoneEligibility(milestone.getId(), adminUser);
        assertThat(resp.isEligible()).isFalse();
        assertThat(resp.getBlockingConditions().stream().anyMatch(c -> c.contains("remains in active status"))).isTrue();
    }

    @Test
    @DisplayName("Negative Scenario 3: Payment request exceeding milestone balance is rejected")
    void testOverpaymentRequestRejected() {
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-NEG-3");
        agReq.setContractValue(new BigDecimal("50000.00"));
        agReq.setStartDate(LocalDate.now().minusDays(5));
        agReq.setEndDate(LocalDate.now().plusDays(60));
        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);

        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(testProject.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(testVendor.getId());
        msReq.setName("Inspection & Testing");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneValue(new BigDecimal("10000.00")); // Value is 10k
        msReq.setPaymentPolicy(PaymentPolicy.PARTIAL_ALLOWED);
        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);

        // Make it eligible
        ProjectMilestone dbMs = milestoneRepository.findById(milestone.getId()).orElseThrow();
        dbMs.setStatus(MilestoneStatus.ELIGIBLE_FOR_PAYMENT);
        milestoneRepository.save(dbMs);

        // Vendor requests 15,000 (exceeds 10,000)
        CreatePaymentRequestDto prDto = new CreatePaymentRequestDto();
        prDto.setInvoiceNumber("INV-EXCEED-001");
        prDto.setInvoiceDate(LocalDate.now());
        prDto.setRequestedAmount(new BigDecimal("15000.00"));

        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () -> {
            paymentRequestService.submitPaymentRequest(milestone.getId(), prDto, vendorUser);
        });
    }

    @Test
    @DisplayName("Negative Scenario 4: Duplicate invoice number submission is prevented")
    void testDuplicateInvoicePrevented() {
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-NEG-4");
        agReq.setContractValue(new BigDecimal("50000.00"));
        agReq.setStartDate(LocalDate.now().minusDays(5));
        agReq.setEndDate(LocalDate.now().plusDays(60));
        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);

        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(testProject.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(testVendor.getId());
        msReq.setName("Ground Handover");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneValue(new BigDecimal("10000.00"));
        msReq.setPaymentPolicy(PaymentPolicy.PARTIAL_ALLOWED);
        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);

        // Force eligible for payment
        ProjectMilestone dbMs = milestoneRepository.findById(milestone.getId()).orElseThrow();
        dbMs.setStatus(MilestoneStatus.ELIGIBLE_FOR_PAYMENT);
        milestoneRepository.save(dbMs);

        // Create first request
        CreatePaymentRequestDto prDto1 = new CreatePaymentRequestDto();
        prDto1.setInvoiceNumber("INV-DUP-101");
        prDto1.setInvoiceDate(LocalDate.now());
        prDto1.setRequestedAmount(new BigDecimal("5000.00"));

        // Save mock payment request with this invoice
        VendorPaymentRequest existing = new VendorPaymentRequest();
        existing.setPaymentRequestCode("PRQ-DUP-01");
        existing.setProject(testProject);
        existing.setAgreement(agreementRepository.findById(agreement.getId()).orElseThrow());
        existing.setMilestone(dbMs);
        existing.setVendor(testVendor);
        existing.setInvoiceNumber("INV-DUP-101");
        existing.setInvoiceDate(LocalDate.now());
        existing.setRequestedAmount(new BigDecimal("5000.00"));
        existing.setStatus(PaymentRequestStatus.SUBMITTED);
        paymentRequestRepository.save(existing);

        // Submit duplicate
        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () -> {
            paymentRequestService.submitPaymentRequest(milestone.getId(), prDto1, vendorUser);
        });
    }

    @Test
    @DisplayName("Negative Scenario 5: Separation of duties prevents applicant from approving own payment request")
    void testSeparationOfDutiesSelfApprovalPrevented() {
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-NEG-5");
        agReq.setContractValue(new BigDecimal("50000.00"));
        agReq.setStartDate(LocalDate.now().minusDays(5));
        agReq.setEndDate(LocalDate.now().plusDays(60));
        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);

        CreateMilestoneRequest msReq = new CreateMilestoneRequest();
        msReq.setProjectId(testProject.getId());
        msReq.setAgreementId(agreement.getId());
        msReq.setVendorId(testVendor.getId());
        msReq.setName("Commissioning Milestone");
        msReq.setSequenceNumber(1);
        msReq.setMilestoneValue(new BigDecimal("10000.00"));
        ProjectMilestoneResponse milestone = milestoneService.createMilestone(msReq, adminUser);

        ProjectMilestone dbMs = milestoneRepository.findById(milestone.getId()).orElseThrow();

        // Admin submits request
        VendorPaymentRequest pr = new VendorPaymentRequest();
        pr.setPaymentRequestCode("PRQ-SELF-01");
        pr.setProject(testProject);
        pr.setAgreement(agreementRepository.findById(agreement.getId()).orElseThrow());
        pr.setMilestone(dbMs);
        pr.setVendor(testVendor);
        pr.setInvoiceNumber("INV-SELF-01");
        pr.setInvoiceDate(LocalDate.now());
        pr.setRequestedAmount(new BigDecimal("10000.00"));
        pr.setStatus(PaymentRequestStatus.SUBMITTED);
        pr.setCreatedBy(adminUser); // Created by admin
        pr = paymentRequestRepository.save(pr);

        FinancialDecisionRequest decReq = new FinancialDecisionRequest();
        decReq.setDecisionType(FinanceDecisionType.APPROVE);
        decReq.setReason("Self approving");

        final String prId = pr.getId();
        // Admin user tries to approve own request -> forbidden
        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () -> {
            financeApprovalService.recordDecision(prId, decReq, adminUser);
        });
    }

    @Test
    @DisplayName("Negative Scenario 6: Agreement versioning tracks commercial updates without modifying historical decisions")
    void testAgreementVersioningAudit() {
        CreateAgreementRequest agReq = new CreateAgreementRequest();
        agReq.setProjectId(testProject.getId());
        agReq.setVendorId(testVendor.getId());
        agReq.setContractReference("CONT-VERS-1");
        agReq.setContractValue(new BigDecimal("50000.00"));
        agReq.setRetentionPercentage(new BigDecimal("3.00"));
        agReq.setStartDate(LocalDate.now().minusDays(5));
        agReq.setEndDate(LocalDate.now().plusDays(60));
        VendorAgreementResponse agreement = agreementService.createAgreement(agReq, adminUser);
        assertThat(agreement.getCurrentVersion()).isEqualTo(1);

        UpdateAgreementRequest upd = new UpdateAgreementRequest();
        upd.setContractReference("CONT-VERS-1");
        upd.setContractValue(new BigDecimal("65000.00")); // Value increased
        upd.setRetentionPercentage(new BigDecimal("5.00"));
        upd.setChangeReason("Scope expansion for 3 additional cross-city junctions");

        VendorAgreementResponse updated = agreementService.updateAgreement(agreement.getId(), upd, adminUser);
        assertThat(updated.getCurrentVersion()).isEqualTo(2);
        assertThat(updated.getContractValue()).isEqualByComparingTo("65000.00");

        List<VendorAgreementVersionResponse> versions = agreementService.getAgreementVersions(agreement.getId());
        assertThat(versions).hasSize(2);
        assertThat(versions.get(0).getVersionNumber()).isEqualTo(2);
        assertThat(versions.get(0).getChangeReason()).contains("Scope expansion");
        assertThat(versions.get(1).getVersionNumber()).isEqualTo(1);
    }

    @Test
    @DisplayName("REST API Security: Unauthorized role cannot access financial endpoints")
    void testRestEndpointRbacGuards() throws Exception {
        // Field Engineer should not be able to authorize payment
        mockMvc.perform(post("/api/v1/finance/payment-requests/test-id/authorize")
                        .header("Authorization", inspectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idempotencyKey\":\"k1\"}"))
                .andExpect(status().isForbidden());

        // Vendor should not be able to approve payments
        mockMvc.perform(post("/api/v1/finance/payment-requests/test-id/decisions")
                        .header("Authorization", vendorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decisionType\":\"APPROVE\",\"reason\":\"trying\"}"))
                .andExpect(status().isForbidden());
    }
}
