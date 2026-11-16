package com.infrapulse.modules.intelligence.risk.service;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.intelligence.defect.entity.InfrastructureDefect;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import com.infrapulse.modules.intelligence.defect.repository.InfrastructureDefectRepository;
import com.infrapulse.modules.intelligence.risk.dto.*;
import com.infrapulse.modules.intelligence.risk.entity.ProjectRiskAlert;
import com.infrapulse.modules.intelligence.risk.entity.ProjectRiskAssessment;
import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskCategory;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.intelligence.risk.repository.ProjectRiskAlertRepository;
import com.infrapulse.modules.intelligence.risk.repository.ProjectRiskAssessmentRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workdependency.entity.WorkTypeDependency;
import com.infrapulse.modules.workdependency.repository.WorkTypeDependencyRepository;
import com.infrapulse.modules.workertrust.entity.WorkerSiteAccess;
import com.infrapulse.modules.workertrust.repository.WorkerSiteAccessRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PredictiveRiskService {

    private static final Logger log = LoggerFactory.getLogger(PredictiveRiskService.class);

    private final ProjectRiskAssessmentRepository assessmentRepository;
    private final ProjectRiskAlertRepository alertRepository;
    private final ProjectRepository projectRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final InfrastructureDefectRepository defectRepository;
    private final WorkerSiteAccessRepository siteAccessRepository;
    private final WorkTypeDependencyRepository dependencyRepository;

    public PredictiveRiskService(
            ProjectRiskAssessmentRepository assessmentRepository,
            ProjectRiskAlertRepository alertRepository,
            ProjectRepository projectRepository,
            WorkAssignmentRepository workAssignmentRepository,
            ProjectMilestoneRepository milestoneRepository,
            CorrectiveActionRepository correctiveActionRepository,
            InfrastructureDefectRepository defectRepository,
            WorkerSiteAccessRepository siteAccessRepository,
            WorkTypeDependencyRepository dependencyRepository) {
        this.assessmentRepository = assessmentRepository;
        this.alertRepository = alertRepository;
        this.projectRepository = projectRepository;
        this.workAssignmentRepository = workAssignmentRepository;
        this.milestoneRepository = milestoneRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.defectRepository = defectRepository;
        this.siteAccessRepository = siteAccessRepository;
        this.dependencyRepository = dependencyRepository;
    }

    public ProjectRiskAssessmentDto evaluateProjectRisk(String projectId, User actor) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        List<ProjectRiskAlert> newAlerts = new ArrayList<>();

        // 1. Schedule Risk Evaluation
        RiskLevel scheduleRisk = RiskLevel.LOW;
        double scheduleScore = 10.0;
        List<ProjectMilestone> milestones = milestoneRepository.findByProjectIdOrderBySequenceNumberAsc(projectId);
        List<ProjectMilestone> overdueMilestones = milestones.stream()
                .filter(m -> m.getPlannedEndDate() != null
                        && m.getPlannedEndDate().isBefore(LocalDate.now())
                        && m.getStatus() != MilestoneStatus.PAID
                        && m.getStatus() != MilestoneStatus.PAYMENT_APPROVED)
                .collect(Collectors.toList());

        if (!overdueMilestones.isEmpty()) {
            scheduleRisk = overdueMilestones.size() > 1 ? RiskLevel.CRITICAL : RiskLevel.HIGH;
            scheduleScore = overdueMilestones.size() > 1 ? 85.0 : 65.0;

            String overdueCodes = overdueMilestones.stream().map(ProjectMilestone::getMilestoneCode).collect(Collectors.joining(", "));
            ProjectRiskAlert alert = new ProjectRiskAlert(
                    project,
                    RiskCategory.SCHEDULE_RISK,
                    scheduleRisk,
                    "Project Milestones Overdue: " + overdueMilestones.size() + " stage(s) delayed",
                    "Target milestone delivery dates have lapsed without completion verification.",
                    "Overdue milestone codes: " + overdueCodes + ". Current date: " + LocalDate.now(),
                    "Incomplete physical work packages and unclosed quality inspection items.",
                    "Delayed milestone disbursement, contractor liquidity pressure, and corridor traffic blockade.",
                    "Issue work acceleration notice and fast-track pending quality inspections."
            );
            newAlerts.add(alert);
        }

        // 2. Vendor Execution Risk
        RiskLevel vendorRisk = RiskLevel.LOW;
        double vendorScore = 12.0;
        Page<CorrectiveAction> openActionsPage = correctiveActionRepository.findFiltered(
                null, CorrectiveActionStatus.OPEN, null, projectId, Pageable.unpaged()
        );
        List<CorrectiveAction> openActions = openActionsPage.getContent();
        if (openActions.size() >= 3) {
            vendorRisk = RiskLevel.HIGH;
            vendorScore = 70.0;
        } else if (openActions.size() > 0) {
            vendorRisk = RiskLevel.MEDIUM;
            vendorScore = 40.0;
        }

        if (openActions.size() >= 2) {
            ProjectRiskAlert alert = new ProjectRiskAlert(
                    project,
                    RiskCategory.VENDOR_EXECUTION_RISK,
                    vendorRisk,
                    "Elevated Vendor Corrective Action Backlog: " + openActions.size() + " unclosed",
                    "Assigned contractors have accumulating open corrective action requests requiring rework.",
                    "Open corrective action count: " + openActions.size() + " items awaiting contractor resubmission.",
                    "Insufficient field supervision or sub-standard material delivery.",
                    "Quality gate rejection during milestone inspection and potential rework penalties.",
                    "Mandate dedicated QA supervisor on site and convene joint vendor coordination review."
            );
            newAlerts.add(alert);
        }

        // 3. Quality Risk (Recurring defects from Defect Intelligence)
        RiskLevel qualityRisk = RiskLevel.LOW;
        double qualityScore = 10.0;
        List<InfrastructureDefect> projectDefects = defectRepository.findByProjectId(projectId);
        List<InfrastructureDefect> recurringDefects = projectDefects.stream()
                .filter(InfrastructureDefect::isRecurring)
                .collect(Collectors.toList());
        List<InfrastructureDefect> criticalDefects = projectDefects.stream()
                .filter(d -> d.getSeverity() == DefectSeverity.CRITICAL && d.getStatus() != DefectStatus.RESOLVED)
                .collect(Collectors.toList());

        if (!criticalDefects.isEmpty() || recurringDefects.size() >= 2) {
            qualityRisk = RiskLevel.CRITICAL;
            qualityScore = 90.0;
        } else if (!recurringDefects.isEmpty() || projectDefects.stream().anyMatch(d -> d.getSeverity() == DefectSeverity.HIGH && d.getStatus() != DefectStatus.RESOLVED)) {
            qualityRisk = RiskLevel.HIGH;
            qualityScore = 65.0;
        } else if (projectDefects.size() > 2) {
            qualityRisk = RiskLevel.MEDIUM;
            qualityScore = 35.0;
        }

        if (qualityRisk == RiskLevel.HIGH || qualityRisk == RiskLevel.CRITICAL) {
            String defectSummary = "Found " + recurringDefects.size() + " recurring defects and " + criticalDefects.size() + " critical unaddressed defects.";
            ProjectRiskAlert alert = new ProjectRiskAlert(
                    project,
                    RiskCategory.QUALITY_RISK,
                    qualityRisk,
                    "High Structural Defect Recurrence Rate Detected",
                    "Computer vision and inspection logs reveal repeated surface cracks or compaction failures in same zones.",
                    defectSummary + " Total project defect count: " + projectDefects.size(),
                    "Underlying sub-grade instability, inadequate compaction rolling, or incorrect bitumen mix ratio.",
                    "Premature road surface deterioration, pothole formation under monsoon conditions.",
                    "Halt wearing course asphalt overlay until core test and re-compaction test are validated."
            );
            newAlerts.add(alert);
        }

        // 4. Resource Risk (WorkerTrust integration)
        RiskLevel resourceRisk = RiskLevel.LOW;
        double resourceScore = 15.0;
        List<WorkAssignment> activeAssignments = workAssignmentRepository.findByProjectId(projectId).stream()
                .filter(a -> a.getStatus() == AssignmentStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        List<WorkerSiteAccess> currentOnSite = siteAccessRepository.findCurrentlyOnSiteByProjectAndZone(projectId, null);
        if (!activeAssignments.isEmpty() && currentOnSite.isEmpty()) {
            resourceRisk = RiskLevel.HIGH;
            resourceScore = 60.0;

            ProjectRiskAlert alert = new ProjectRiskAlert(
                    project,
                    RiskCategory.RESOURCE_RISK,
                    RiskLevel.HIGH,
                    "Zero Verified Workforce Checked In for Active Assignments",
                    "Work assignments are marked IN_PROGRESS but WorkerTrust site access logs indicate 0 verified workers checked in.",
                    "Active assignments in progress: " + activeAssignments.size() + ", Workers on site: 0.",
                    "Unregistered labor bypass of access turnstiles, or stalled site work without status update.",
                    "Severe safety liability, non-compliance with municipal safety directives, and DPDP act breach.",
                    "Dispatch field supervisor to verify site presence and enforce digital QR check-in protocol."
            );
            newAlerts.add(alert);
        }

        // 5. Dependency Bottleneck Risk
        RiskLevel dependencyRisk = RiskLevel.LOW;
        double dependencyScore = 10.0;
        List<WorkTypeDependency> applicableRules = dependencyRepository.findAllApplicableRules(projectId);
        if (!applicableRules.isEmpty() && !activeAssignments.isEmpty()) {
            dependencyScore = 25.0;
            dependencyRisk = RiskLevel.LOW;
        }

        // Overall Score Calculation (weighted)
        // Schedule 25%, Vendor 25%, Quality 25%, Resource 15%, Dependency 10%
        double totalWeightedScore = (scheduleScore * 0.25)
                + (vendorScore * 0.25)
                + (qualityScore * 0.25)
                + (resourceScore * 0.15)
                + (dependencyScore * 0.10);

        totalWeightedScore = Math.min(100.0, Math.max(0.0, totalWeightedScore));
        BigDecimal overallScore = BigDecimal.valueOf(totalWeightedScore).setScale(2, RoundingMode.HALF_UP);

        RiskLevel overallLevel;
        if (totalWeightedScore >= 75.0) {
            overallLevel = RiskLevel.CRITICAL;
        } else if (totalWeightedScore >= 50.0) {
            overallLevel = RiskLevel.HIGH;
        } else if (totalWeightedScore >= 25.0) {
            overallLevel = RiskLevel.MEDIUM;
        } else {
            overallLevel = RiskLevel.LOW;
        }

        Long nextSeq = assessmentRepository.getNextAssessmentSeq();
        String assessmentCode = String.format("RSK-ASSESS-%05d", nextSeq != null ? nextSeq : System.currentTimeMillis() % 100000);

        ProjectRiskAssessment assessment = new ProjectRiskAssessment(
                assessmentCode,
                project,
                null,
                overallLevel,
                overallScore
        );
        assessment.setScheduleRiskLevel(scheduleRisk);
        assessment.setVendorRiskLevel(vendorRisk);
        assessment.setQualityRiskLevel(qualityRisk);
        assessment.setResourceRiskLevel(resourceRisk);
        assessment.setDependencyRiskLevel(dependencyRisk);
        assessment.setCalculationMethod("MULTI_DIMENSIONAL_HEURISTIC_V2");
        assessment.setEvaluatedAt(Instant.now());

        assessment = assessmentRepository.save(assessment);

        // Save newly generated alerts
        for (ProjectRiskAlert alert : newAlerts) {
            alert.setAssessment(assessment);
            alertRepository.save(alert);
        }

        long activeCount = alertRepository.countByProjectIdAndAlertStatus(projectId, RiskAlertStatus.ACTIVE);

        return new ProjectRiskAssessmentDto(
                assessment.getId(),
                assessment.getAssessmentCode(),
                project.getId(),
                project.getProjectName(),
                null,
                null,
                assessment.getOverallRiskLevel(),
                assessment.getScheduleRiskLevel(),
                assessment.getVendorRiskLevel(),
                assessment.getQualityRiskLevel(),
                assessment.getResourceRiskLevel(),
                assessment.getDependencyRiskLevel(),
                assessment.getOverallScore(),
                assessment.getCalculationMethod(),
                assessment.getEvaluatedAt(),
                activeCount
        );
    }

    @Transactional(readOnly = true)
    public Page<ProjectRiskAlertDto> searchAlerts(String projectId, RiskCategory category, RiskLevel level, RiskAlertStatus status, Pageable pageable) {
        return alertRepository.searchAlerts(projectId, category, level, status, pageable)
                .map(this::mapAlertToDto);
    }

    @Transactional(readOnly = true)
    public ProjectRiskAlertDto getAlertById(String alertId) {
        ProjectRiskAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Risk alert not found: " + alertId));
        return mapAlertToDto(alert);
    }

    public ProjectRiskAlertDto updateAlertStatus(String alertId, RiskResolutionRequest req, User actor) {
        ProjectRiskAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Risk alert not found: " + alertId));

        alert.setAlertStatus(req.status());
        alert.setResolutionNotes(req.resolutionNotes());
        alert.setResolvedBy(actor);
        if (req.status() == RiskAlertStatus.RESOLVED || req.status() == RiskAlertStatus.DISMISSED) {
            alert.setResolvedAt(Instant.now());
        }

        alert = alertRepository.save(alert);
        return mapAlertToDto(alert);
    }

    @Transactional(readOnly = true)
    public Optional<ProjectRiskAssessmentDto> getLatestAssessment(String projectId) {
        return assessmentRepository.findFirstByProjectIdOrderByEvaluatedAtDesc(projectId)
                .map(a -> {
                    long activeCount = alertRepository.countByProjectIdAndAlertStatus(projectId, RiskAlertStatus.ACTIVE);
                    return new ProjectRiskAssessmentDto(
                            a.getId(),
                            a.getAssessmentCode(),
                            a.getProject().getId(),
                            a.getProject().getProjectName(),
                            a.getWorkZone() != null ? a.getWorkZone().getId() : null,
                            a.getWorkZone() != null ? a.getWorkZone().getZoneName() : null,
                            a.getOverallRiskLevel(),
                            a.getScheduleRiskLevel(),
                            a.getVendorRiskLevel(),
                            a.getQualityRiskLevel(),
                            a.getResourceRiskLevel(),
                            a.getDependencyRiskLevel(),
                            a.getOverallScore(),
                            a.getCalculationMethod(),
                            a.getEvaluatedAt(),
                            activeCount
                    );
                });
    }

    @Transactional(readOnly = true)
    public RiskDashboardSummaryDto getRiskDashboardSummary(String projectId) {
        Project project = (projectId != null && !projectId.isBlank())
                ? projectRepository.findById(projectId).orElse(null)
                : projectRepository.findAll().stream().findFirst().orElse(null);

        if (project == null) {
            return new RiskDashboardSummaryDto(
                    projectId != null ? projectId : "none",
                    "No Project Available",
                    RiskLevel.LOW,
                    BigDecimal.ZERO,
                    0L, 0L, 0L, 0L, 0L,
                    Collections.emptyMap(),
                    Collections.emptyList()
            );
        }

        String actualProjectId = project.getId();
        Optional<ProjectRiskAssessment> latestOpt = assessmentRepository.findFirstByProjectIdOrderByEvaluatedAtDesc(actualProjectId);
        RiskLevel overallLevel = latestOpt.map(ProjectRiskAssessment::getOverallRiskLevel).orElse(RiskLevel.LOW);
        BigDecimal overallScore = latestOpt.map(ProjectRiskAssessment::getOverallScore).orElse(BigDecimal.valueOf(15.00));

        List<ProjectRiskAlert> activeAlerts = alertRepository.findByProjectIdAndAlertStatus(actualProjectId, RiskAlertStatus.ACTIVE);
        long totalActive = activeAlerts.size();
        long critical = activeAlerts.stream().filter(a -> a.getRiskLevel() == RiskLevel.CRITICAL).count();
        long high = activeAlerts.stream().filter(a -> a.getRiskLevel() == RiskLevel.HIGH).count();
        long medium = activeAlerts.stream().filter(a -> a.getRiskLevel() == RiskLevel.MEDIUM).count();
        long low = activeAlerts.stream().filter(a -> a.getRiskLevel() == RiskLevel.LOW).count();

        Map<String, Long> byCategory = activeAlerts.stream()
                .collect(Collectors.groupingBy(a -> a.getRiskCategory().name(), Collectors.counting()));

        List<ProjectRiskAlertDto> topAlerts = activeAlerts.stream()
                .sorted((a, b) -> b.getRiskLevel().compareTo(a.getRiskLevel()))
                .limit(5)
                .map(this::mapAlertToDto)
                .collect(Collectors.toList());

        return new RiskDashboardSummaryDto(
                project.getId(),
                project.getProjectName(),
                overallLevel,
                overallScore,
                totalActive,
                critical,
                high,
                medium,
                low,
                byCategory,
                topAlerts
        );
    }

    private ProjectRiskAlertDto mapAlertToDto(ProjectRiskAlert a) {
        String assessmentId = a.getAssessment() != null ? a.getAssessment().getId() : null;
        String zoneName = a.getWorkZone() != null ? a.getWorkZone().getZoneName() : null;
        String vendorName = a.getVendor() != null ? a.getVendor().getCompanyName() : null;
        String assignmentCode = a.getWorkAssignment() != null ? a.getWorkAssignment().getAssignmentCode() : null;
        String resolvedByName = a.getResolvedBy() != null ? a.getResolvedBy().getFullName() : null;

        return new ProjectRiskAlertDto(
                a.getId(),
                assessmentId,
                a.getProject().getId(),
                a.getProject().getProjectName(),
                a.getWorkZone() != null ? a.getWorkZone().getId() : null,
                zoneName,
                a.getVendor() != null ? a.getVendor().getId() : null,
                vendorName,
                a.getWorkAssignment() != null ? a.getWorkAssignment().getId() : null,
                assignmentCode,
                a.getRiskCategory(),
                a.getRiskLevel(),
                a.getTitle(),
                a.getProblemStatement(),
                a.getSupportingEvidenceData(),
                a.getRootCauseReason(),
                a.getOperationalImpact(),
                a.getRecommendedAction(),
                a.getMissingDataNotes(),
                a.getAlertStatus(),
                a.getResolvedBy() != null ? a.getResolvedBy().getId() : null,
                resolvedByName,
                a.getResolutionNotes(),
                a.getResolvedAt(),
                a.getCreatedAt()
        );
    }
}
