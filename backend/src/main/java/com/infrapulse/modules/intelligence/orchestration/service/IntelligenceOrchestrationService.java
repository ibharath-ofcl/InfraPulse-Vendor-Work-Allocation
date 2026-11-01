package com.infrapulse.modules.intelligence.orchestration.service;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.intelligence.contract.dto.ContractComplianceSummaryDto;
import com.infrapulse.modules.intelligence.contract.entity.ContractRequirement;
import com.infrapulse.modules.intelligence.contract.entity.ContractRequirementEvidence;
import com.infrapulse.modules.intelligence.contract.model.RequirementApprovalStatus;
import com.infrapulse.modules.intelligence.contract.model.RequirementEvidenceStatus;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementEvidenceRepository;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementRepository;
import com.infrapulse.modules.intelligence.contract.service.ContractIntelligenceService;
import com.infrapulse.modules.intelligence.defect.dto.CreateDefectRequest;
import com.infrapulse.modules.intelligence.defect.dto.DefectDashboardSummaryDto;
import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import com.infrapulse.modules.intelligence.defect.service.DefectIntelligenceService;
import com.infrapulse.modules.intelligence.orchestration.dto.IntelligenceOverviewDto;
import com.infrapulse.modules.intelligence.risk.dto.RiskDashboardSummaryDto;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.intelligence.risk.service.PredictiveRiskService;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class IntelligenceOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceOrchestrationService.class);

    private final ProjectRepository projectRepository;
    private final ContractIntelligenceService contractService;
    private final DefectIntelligenceService defectService;
    private final PredictiveRiskService riskService;
    private final ContractRequirementRepository requirementRepository;
    private final ContractRequirementEvidenceRepository requirementEvidenceRepository;

    public IntelligenceOrchestrationService(
            ProjectRepository projectRepository,
            ContractIntelligenceService contractService,
            DefectIntelligenceService defectService,
            PredictiveRiskService riskService,
            ContractRequirementRepository requirementRepository,
            ContractRequirementEvidenceRepository requirementEvidenceRepository) {
        this.projectRepository = projectRepository;
        this.contractService = contractService;
        this.defectService = defectService;
        this.riskService = riskService;
        this.requirementRepository = requirementRepository;
        this.requirementEvidenceRepository = requirementEvidenceRepository;
    }

    @Transactional(readOnly = true)
    public IntelligenceOverviewDto getProjectIntelligenceOverview(String projectId) {
        Project project = (projectId != null && !projectId.isBlank())
                ? projectRepository.findById(projectId).orElse(null)
                : projectRepository.findAll().stream().findFirst().orElse(null);

        if (project == null) {
            return new IntelligenceOverviewDto(
                    projectId != null ? projectId : "none",
                    "No Project Available",
                    0, 0, 0, 0, 0, BigDecimal.ZERO,
                    0, 0, 0, 0.0, 0, java.util.Map.of(),
                    RiskLevel.LOW, BigDecimal.ZERO, 0, 0,
                    Instant.now()
            );
        }

        String actualProjectId = project.getId();
        ContractComplianceSummaryDto contractSummary = contractService.getProjectComplianceSummary(actualProjectId);
        DefectDashboardSummaryDto defectSummary = defectService.getDefectDashboardSummary(actualProjectId);
        RiskDashboardSummaryDto riskSummary = riskService.getRiskDashboardSummary(actualProjectId);

        return new IntelligenceOverviewDto(
                actualProjectId,
                project.getProjectName(),
                contractSummary.totalContracts(),
                contractSummary.totalRequirements(),
                contractSummary.approvedRequirements(),
                contractSummary.verifiedEvidenceRequirements(),
                contractSummary.physicalMeasurementRequiredCount(),
                contractSummary.overallCompliancePercentage(),
                defectSummary.totalDefects(),
                defectSummary.openDefects(),
                defectSummary.recurringDefects(),
                defectSummary.recurringPercentage(),
                defectSummary.resolvedDefects(),
                defectSummary.defectsByCategory(),
                riskSummary.overallRiskLevel(),
                riskSummary.overallScore(),
                riskSummary.totalActiveAlerts(),
                riskSummary.criticalAlerts(),
                Instant.now()
        );
    }

    public void autoMapEvidenceToRequirements(WorkEvidence evidence) {
        if (evidence == null || evidence.getWorkAssignment() == null || evidence.getWorkAssignment().getProject() == null) {
            return;
        }

        String projectId = evidence.getWorkAssignment().getProject().getId();
        List<ContractRequirement> approvedReqs = requirementRepository.findByProjectIdAndApprovalStatus(
                projectId, RequirementApprovalStatus.APPROVED, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        for (ContractRequirement req : approvedReqs) {
            // Check if already mapped
            if (requirementEvidenceRepository.findByRequirementIdAndEvidenceId(req.getId(), evidence.getId()).isPresent()) {
                continue;
            }

            ContractRequirementEvidence link = new ContractRequirementEvidence(
                    req,
                    evidence.getWorkAssignment(),
                    evidence
            );

            // If requirement requires physical measurement, mark REQUIRES_PHYSICAL_MEASUREMENT, else VERIFIED
            if (req.isRequiresPhysicalMeasurement()) {
                link.setStatus(RequirementEvidenceStatus.REQUIRES_PHYSICAL_MEASUREMENT);
                link.setMeasurementNotes("Evidence attached. Calibration / physical measurement record required.");
            } else {
                link.setStatus(RequirementEvidenceStatus.VERIFIED);
                link.setMeasurementNotes("Visual compliance evidence auto-mapped from uploaded work evidence.");
            }

            requirementEvidenceRepository.save(link);
            log.info("Auto-mapped evidence {} to contract requirement {}", evidence.getEvidenceCode(), req.getRequirementCode());
        }
    }

    public void recordDefectFromInspection(
            String projectId,
            String workZoneId,
            String vendorId,
            String assignmentId,
            String evidenceId,
            DefectCategory category,
            DefectSeverity severity,
            String description,
            User actor
    ) {
        CreateDefectRequest req = new CreateDefectRequest(
                evidenceId,
                assignmentId,
                projectId,
                workZoneId,
                vendorId,
                category,
                severity,
                BigDecimal.valueOf(0.88),
                null,
                "infrapulse-vision-v2",
                "2.4.0",
                description
        );
        defectService.createDefect(req, actor);
    }
}
