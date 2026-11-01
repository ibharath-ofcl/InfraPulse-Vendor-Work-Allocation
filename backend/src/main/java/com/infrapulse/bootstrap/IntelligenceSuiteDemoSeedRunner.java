package com.infrapulse.bootstrap;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.intelligence.contract.entity.ContractRequirement;
import com.infrapulse.modules.intelligence.contract.entity.ContractRequirementEvidence;
import com.infrapulse.modules.intelligence.contract.entity.ProjectContract;
import com.infrapulse.modules.intelligence.contract.model.*;
import com.infrapulse.modules.intelligence.contract.repository.ContractDocumentRepository;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementEvidenceRepository;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementRepository;
import com.infrapulse.modules.intelligence.contract.repository.ProjectContractRepository;
import com.infrapulse.modules.intelligence.defect.entity.DefectHistoryEvent;
import com.infrapulse.modules.intelligence.defect.entity.DefectSimilarityCandidate;
import com.infrapulse.modules.intelligence.defect.entity.InfrastructureDefect;
import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import com.infrapulse.modules.intelligence.defect.repository.DefectHistoryEventRepository;
import com.infrapulse.modules.intelligence.defect.repository.DefectSimilarityCandidateRepository;
import com.infrapulse.modules.intelligence.defect.repository.InfrastructureDefectRepository;
import com.infrapulse.modules.intelligence.risk.entity.ProjectRiskAlert;
import com.infrapulse.modules.intelligence.risk.entity.ProjectRiskAssessment;
import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskCategory;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.intelligence.risk.repository.ProjectRiskAlertRepository;
import com.infrapulse.modules.intelligence.risk.repository.ProjectRiskAssessmentRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@Order(4)
@Profile("!test")
public class IntelligenceSuiteDemoSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceSuiteDemoSeedRunner.class);

    private final ProjectContractRepository contractRepository;
    private final ContractDocumentRepository documentRepository;
    private final ContractRequirementRepository requirementRepository;
    private final ContractRequirementEvidenceRepository requirementEvidenceRepository;
    private final InfrastructureDefectRepository defectRepository;
    private final DefectSimilarityCandidateRepository candidateRepository;
    private final DefectHistoryEventRepository defectHistoryRepository;
    private final ProjectRiskAssessmentRepository assessmentRepository;
    private final ProjectRiskAlertRepository riskAlertRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final VendorRepository vendorRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final WorkEvidenceRepository evidenceRepository;
    private final UserRepository userRepository;

    public IntelligenceSuiteDemoSeedRunner(
            ProjectContractRepository contractRepository,
            ContractDocumentRepository documentRepository,
            ContractRequirementRepository requirementRepository,
            ContractRequirementEvidenceRepository requirementEvidenceRepository,
            InfrastructureDefectRepository defectRepository,
            DefectSimilarityCandidateRepository candidateRepository,
            DefectHistoryEventRepository defectHistoryRepository,
            ProjectRiskAssessmentRepository assessmentRepository,
            ProjectRiskAlertRepository riskAlertRepository,
            ProjectRepository projectRepository,
            WorkZoneRepository workZoneRepository,
            VendorRepository vendorRepository,
            WorkAssignmentRepository assignmentRepository,
            WorkEvidenceRepository evidenceRepository,
            UserRepository userRepository) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
        this.requirementRepository = requirementRepository;
        this.requirementEvidenceRepository = requirementEvidenceRepository;
        this.defectRepository = defectRepository;
        this.candidateRepository = candidateRepository;
        this.defectHistoryRepository = defectHistoryRepository;
        this.assessmentRepository = assessmentRepository;
        this.riskAlertRepository = riskAlertRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.vendorRepository = vendorRepository;
        this.assignmentRepository = assignmentRepository;
        this.evidenceRepository = evidenceRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (contractRepository.count() > 0) {
                log.info("Intelligence Suite seed data already exists. Skipping initialization.");
                return;
            }

            log.info("Starting InfraPulse Intelligence Suite demo data seeding...");

            List<Project> projects = projectRepository.findAll();
            if (projects.isEmpty()) {
                log.warn("No projects found to attach Intelligence Suite data to.");
                return;
            }

            Project chennaiProject = projects.stream()
                    .filter(p -> p.getProjectName() != null && p.getProjectName().toLowerCase().contains("chennai"))
                    .findFirst()
                    .orElse(projects.get(0));

            List<Vendor> vendors = vendorRepository.findAll();
            Vendor apexVendor = vendors.isEmpty() ? null : vendors.get(0);

            List<WorkZone> zones = workZoneRepository.findByProjectId(chennaiProject.getId());
            WorkZone zone1 = zones.isEmpty() ? null : zones.get(0);

            List<WorkAssignment> assignments = assignmentRepository.findByProjectId(chennaiProject.getId());
            WorkAssignment assignment1 = assignments.isEmpty() ? null : assignments.get(0);

            List<WorkEvidence> evidences = evidenceRepository.findAll();
            WorkEvidence evidence1 = evidences.isEmpty() ? null : evidences.get(0);

            User adminUser = userRepository.findByEmail("admin@infrapulse.gov.in").orElse(null);

            // 1. Seed Project Contract
            ProjectContract contract = new ProjectContract(
                    chennaiProject,
                    "CNT-2026-CH-001",
                    "Anna Salai Smart Arterial Corridor Modernization Contract",
                    apexVendor,
                    ContractType.CIVIL_INFRASTRUCTURE,
                    BigDecimal.valueOf(45000000.00),
                    adminUser
            );
            contract.setStatus(ContractStatus.ACTIVE);
            contract.setStartDate(LocalDate.now().minusMonths(3));
            contract.setEndDate(LocalDate.now().plusMonths(9));
            contract.setDescription("Scope of works covers 4.2 km arterial road milling, DBM overlay, wearing course, utility trenching, and safety barriers.");
            contract = contractRepository.save(contract);

            // 2. Seed Contract Requirements
            ContractRequirement req1 = new ContractRequirement(
                    contract,
                    chennaiProject,
                    "REQ-00001",
                    "ROAD_CARRIAGEWAY_SURFACING",
                    "Bituminous Concrete Wearing Course Nominal Thickness",
                    "Bituminous Concrete wearing course must have a compacted nominal thickness of 40 mm with allowable tolerance ± 3 mm in accordance with MoRTH Section 500.",
                    RequirementCategory.MATERIAL_QUALITY,
                    "Compacted core thickness between 37 mm and 43 mm verified via vernier caliper core extraction."
            );
            req1.setMeasurementUnit("mm");
            req1.setRequiredValue("40.0");
            req1.setPermittedTolerance("± 3.0 mm");
            req1.setVerificationMethod(VerificationMethod.PHYSICAL_MEASUREMENT);
            req1.setRequiresPhysicalMeasurement(true);
            req1.setApprovalStatus(RequirementApprovalStatus.APPROVED);
            req1.setApprovedBy(adminUser);
            req1.setApprovedAt(Instant.now().minus(20, ChronoUnit.DAYS));
            req1 = requirementRepository.save(req1);

            ContractRequirement req2 = new ContractRequirement(
                    contract,
                    chennaiProject,
                    "REQ-00002",
                    "SUB_BASE_EARTHWORKS",
                    "Granular Sub-Base Modified Proctor Compaction Density",
                    "Granular sub-base layer must achieve minimum 98% of maximum dry density (MDD) verified by calibrated nuclear density gauge.",
                    RequirementCategory.TOLERANCE,
                    "Minimum dry density ratio >= 98.0% across 5 random test locations per 500m."
            );
            req2.setMeasurementUnit("%");
            req2.setRequiredValue("98.0");
            req2.setPermittedTolerance(">= 98.0%");
            req2.setVerificationMethod(VerificationMethod.PHYSICAL_MEASUREMENT);
            req2.setRequiresPhysicalMeasurement(true);
            req2.setApprovalStatus(RequirementApprovalStatus.APPROVED);
            req2.setApprovedBy(adminUser);
            req2.setApprovedAt(Instant.now().minus(20, ChronoUnit.DAYS));
            req2 = requirementRepository.save(req2);

            ContractRequirement req3 = new ContractRequirement(
                    contract,
                    chennaiProject,
                    "REQ-00003",
                    "DRAINAGE_AND_CURBS",
                    "Precast Concrete Curb Alignment and Crack-Free Visual Finish",
                    "Precast roadside curb stones must maintain straight line alignment within 5 mm variance, zero structural cracks exceeding 0.3 mm width.",
                    RequirementCategory.DIMENSIONAL,
                    "Photo evidence of continuous curb line with zero spalling or displacement."
            );
            req3.setVerificationMethod(VerificationMethod.PHOTO_EVIDENCE);
            req3.setRequiresPhysicalMeasurement(false);
            req3.setApprovalStatus(RequirementApprovalStatus.APPROVED);
            req3.setApprovedBy(adminUser);
            req3.setApprovedAt(Instant.now().minus(15, ChronoUnit.DAYS));
            req3 = requirementRepository.save(req3);

            ContractRequirement req4 = new ContractRequirement(
                    contract,
                    chennaiProject,
                    "REQ-00004",
                    "UTILITY_TRENCHING",
                    "Deep Utility Trench Continuous Shoring and Safety Barricades",
                    "All utility excavations deeper than 1.2 m must feature continuous steel trench shoring, high-visibility orange warning barricades, and solar flashers.",
                    RequirementCategory.SAFETY_RULE,
                    "Continuous safety barricades without openings adjacent to vehicular traffic."
            );
            req4.setVerificationMethod(VerificationMethod.PHOTO_EVIDENCE);
            req4.setRequiresPhysicalMeasurement(false);
            req4.setApprovalStatus(RequirementApprovalStatus.APPROVED);
            req4.setApprovedBy(adminUser);
            req4.setApprovedAt(Instant.now().minus(15, ChronoUnit.DAYS));
            req4 = requirementRepository.save(req4);

            // 3. Seed Requirement Evidence Links
            if (evidence1 != null) {
                ContractRequirementEvidence cre1 = new ContractRequirementEvidence(req1, assignment1, evidence1);
                cre1.setStatus(RequirementEvidenceStatus.VERIFIED);
                cre1.setMeasuredValue("41.2");
                cre1.setMeasurementUnit("mm");
                cre1.setPhysicalMeasurementTool("Digital Vernier Caliper DCV-9981");
                cre1.setMeasurementNotes("Calibrated core vernier measurement at Ch 1+240 LHS.");
                cre1.setMeasuredBy(adminUser);
                cre1.setMeasuredAt(Instant.now().minus(10, ChronoUnit.DAYS));
                cre1.setVerifiedAt(Instant.now().minus(10, ChronoUnit.DAYS));
                requirementEvidenceRepository.save(cre1);

                ContractRequirementEvidence cre2 = new ContractRequirementEvidence(req2, assignment1, evidence1);
                cre2.setStatus(RequirementEvidenceStatus.VERIFIED);
                cre2.setMeasuredValue("98.6");
                cre2.setMeasurementUnit("%");
                cre2.setPhysicalMeasurementTool("Troxler 3440 Nuclear Density Gauge");
                cre2.setMeasurementNotes("Nuclear gauge compaction test verified per ASTM D6938.");
                cre2.setMeasuredBy(adminUser);
                cre2.setMeasuredAt(Instant.now().minus(10, ChronoUnit.DAYS));
                cre2.setVerifiedAt(Instant.now().minus(10, ChronoUnit.DAYS));
                requirementEvidenceRepository.save(cre2);

                ContractRequirementEvidence cre3 = new ContractRequirementEvidence(req3, assignment1, evidence1);
                cre3.setStatus(RequirementEvidenceStatus.VERIFIED);
                cre3.setMeasurementNotes("High-resolution imagery validates linear curb placement with 0 spalling.");
                cre3.setVerifiedAt(Instant.now().minus(8, ChronoUnit.DAYS));
                requirementEvidenceRepository.save(cre3);
            }

            // 4. Seed Infrastructure Defects
            InfrastructureDefect defect1 = new InfrastructureDefect(
                    "DEF-00001",
                    chennaiProject,
                    zone1,
                    apexVendor,
                    DefectCategory.ROAD_CRACK,
                    DefectSeverity.HIGH,
                    "Longitudinal surface cracking observed along bituminous joint between Ch 1+320 and 1+345."
            );
            defect1.setEvidence(evidence1);
            defect1.setAssignment(assignment1);
            defect1.setStatus(DefectStatus.UNDER_REVIEW);
            defect1.setConfidence(BigDecimal.valueOf(0.9120));
            defect1.setReviewedBy(adminUser);
            defect1.setInitialDetectedAt(Instant.now().minus(5, ChronoUnit.DAYS));
            defect1 = defectRepository.save(defect1);

            DefectHistoryEvent evt1 = new DefectHistoryEvent(
                    defect1, null, "UNDER_REVIEW", "COMPUTER_VISION_SCAN",
                    "Automated vision model flagged 25m continuous joint seam fissure", adminUser, "PLATFORM_ADMIN"
            );
            defectHistoryRepository.save(evt1);

            InfrastructureDefect defect2 = new InfrastructureDefect(
                    "DEF-00002",
                    chennaiProject,
                    zone1,
                    apexVendor,
                    DefectCategory.POTHOLE,
                    DefectSeverity.HIGH,
                    "Pothole crater depression (approx 45 cm diameter, 6 cm depth) forming near rainwater inlet."
            );
            defect2.setEvidence(evidence1);
            defect2.setAssignment(assignment1);
            defect2.setStatus(DefectStatus.CORRECTIVE_ACTION_REQUIRED);
            defect2.setConfidence(BigDecimal.valueOf(0.9450));
            defect2.setRecurring(true);
            defect2.setRecurrenceCount(2);
            defect2.setRecurringClusterId(defect1.getId());
            defect2.setReviewedBy(adminUser);
            defect2.setInitialDetectedAt(Instant.now().minus(4, ChronoUnit.DAYS));
            defect2 = defectRepository.save(defect2);

            DefectHistoryEvent evt2 = new DefectHistoryEvent(
                    defect2, "DETECTED", "CORRECTIVE_ACTION_REQUIRED", "PUNCHLIST_NOTICE",
                    "Notice issued to contractor for rapid mastic asphalt patch and compaction re-roll.", adminUser, "PLATFORM_ADMIN"
            );
            defectHistoryRepository.save(evt2);

            InfrastructureDefect defect3 = new InfrastructureDefect(
                    "DEF-00003",
                    chennaiProject,
                    zone1,
                    apexVendor,
                    DefectCategory.WATER_ACCUMULATION,
                    DefectSeverity.MEDIUM,
                    "Localized stormwater ponding (depth 3 cm) caused by insufficient 2.5% camber crossfall."
            );
            defect3.setStatus(DefectStatus.CONFIRMED);
            defect3.setConfidence(BigDecimal.valueOf(0.8750));
            defect3.setReviewedBy(adminUser);
            defect3.setInitialDetectedAt(Instant.now().minus(3, ChronoUnit.DAYS));
            defectRepository.save(defect3);

            InfrastructureDefect defect4 = new InfrastructureDefect(
                    "DEF-00004",
                    chennaiProject,
                    zone1,
                    apexVendor,
                    DefectCategory.MISSING_SAFETY_BARRIER,
                    DefectSeverity.CRITICAL,
                    "Utility trench excavated along school frontage missing continuous retro-reflective barricade fence."
            );
            defect4.setStatus(DefectStatus.RESOLVED);
            defect4.setConfidence(BigDecimal.valueOf(0.9650));
            defect4.setResolvedAt(Instant.now().minus(1, ChronoUnit.DAYS));
            defect4.setReviewedBy(adminUser);
            defect4.setReviewNotes("Contractor mobilized 60 meters of Class-A barricading and red LED beacons. Verified on site.");
            defectRepository.save(defect4);

            // Defect recurrence similarity link
            DefectSimilarityCandidate sim = new DefectSimilarityCandidate(
                    defect2,
                    defect1,
                    BigDecimal.valueOf(0.88),
                    BigDecimal.valueOf(14.2),
                    1,
                    "Spatial proximity (14.2m) and road asphalt distress category congruence"
            );
            sim.setHumanConfirmed(true);
            candidateRepository.save(sim);

            // 5. Seed Project Risk Assessment and Alerts
            ProjectRiskAssessment assess = new ProjectRiskAssessment(
                    "RSK-ASSESS-00001",
                    chennaiProject,
                    zone1,
                    RiskLevel.MEDIUM,
                    BigDecimal.valueOf(42.50)
            );
            assess.setScheduleRiskLevel(RiskLevel.MEDIUM);
            assess.setVendorRiskLevel(RiskLevel.LOW);
            assess.setQualityRiskLevel(RiskLevel.HIGH);
            assess.setResourceRiskLevel(RiskLevel.LOW);
            assess.setDependencyRiskLevel(RiskLevel.LOW);
            assess.setCalculationMethod("MULTI_DIMENSIONAL_HEURISTIC_V2");
            assess.setEvaluatedAt(Instant.now().minus(2, ChronoUnit.HOURS));
            assess = assessmentRepository.save(assess);

            ProjectRiskAlert alert1 = new ProjectRiskAlert(
                    chennaiProject,
                    RiskCategory.QUALITY_RISK,
                    RiskLevel.HIGH,
                    "Repeated Asphalt Distress in Corridor Sector Zone-1",
                    "Computer vision and inspection logs reveal repeated surface cracks and localized water accumulation within 15 meters.",
                    "Defects DEF-00001 and DEF-00002 flagged with 88% similarity index and 14.2m spatial separation.",
                    "Underlying wet subgrade settlement or improper tack coat bonding between asphalt courses.",
                    "Premature wearing course raveling and severe potholes during impending Northeast monsoon rainfall.",
                    "Mandate core test sample extraction and seal micro-fissures with hot bitumen sealant before final handover."
            );
            alert1.setAssessment(assess);
            alert1.setAlertStatus(RiskAlertStatus.ACTIVE);
            riskAlertRepository.save(alert1);

            ProjectRiskAlert alert2 = new ProjectRiskAlert(
                    chennaiProject,
                    RiskCategory.SCHEDULE_RISK,
                    RiskLevel.MEDIUM,
                    "Monsoon Trench Closure Target Pacing Lag",
                    "Utility trench reinstatement velocity (120 m/week) is 25% below planned pacing (160 m/week).",
                    "420 meters of open trench remain ahead of seasonal rain deadline in 18 days.",
                    "Underground rock encounter and delayed telecom clearance for fiber rerouting.",
                    "Flooding of open trenches, traffic bottleneck penalties, and deferred milestone disbursement.",
                    "Authorize twin-shift trench backfilling crew and deploy additional mechanical tamper units."
            );
            alert2.setAssessment(assess);
            alert2.setAlertStatus(RiskAlertStatus.ACTIVE);
            riskAlertRepository.save(alert2);

            log.info("InfraPulse Intelligence Suite demo data successfully seeded!");

        } catch (Exception e) {
            log.error("Failed to seed Intelligence Suite demo data: {}", e.getMessage(), e);
        }
    }
}
