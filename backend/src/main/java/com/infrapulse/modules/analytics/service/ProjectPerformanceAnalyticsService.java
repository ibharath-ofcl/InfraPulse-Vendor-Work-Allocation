package com.infrapulse.modules.analytics.service;

import com.infrapulse.modules.analytics.dto.ProjectPerformanceDto;
import com.infrapulse.modules.finance.entity.PaymentAuthorization;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
import com.infrapulse.modules.finance.repository.PaymentAuthorizationRepository;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.humanreview.model.ReviewDecisionType;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.humanreview.repository.HumanInspectionDecisionRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ProjectPerformanceAnalyticsService {

    private final ProjectRepository projectRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final WorkZoneRepository workZoneRepository;
    private final HumanInspectionDecisionRepository decisionRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final PaymentAuthorizationRepository authorizationRepository;

    public ProjectPerformanceAnalyticsService(
            ProjectRepository projectRepository,
            WorkAssignmentRepository assignmentRepository,
            WorkZoneRepository workZoneRepository,
            HumanInspectionDecisionRepository decisionRepository,
            CorrectiveActionRepository correctiveActionRepository,
            ProjectMilestoneRepository milestoneRepository,
            PaymentAuthorizationRepository authorizationRepository
    ) {
        this.projectRepository = projectRepository;
        this.assignmentRepository = assignmentRepository;
        this.workZoneRepository = workZoneRepository;
        this.decisionRepository = decisionRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.milestoneRepository = milestoneRepository;
        this.authorizationRepository = authorizationRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectPerformanceDto> getAllProjectsPerformance() {
        return projectRepository.findAll().stream()
                .map(this::calculateProjectPerformance)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectPerformanceDto getProjectPerformance(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + projectId));
        return calculateProjectPerformance(project);
    }

    public ProjectPerformanceDto calculateProjectPerformance(Project project) {
        ProjectPerformanceDto dto = new ProjectPerformanceDto();
        dto.setProjectId(project.getId());
        dto.setProjectCode(project.getProjectCode());
        dto.setProjectName(project.getProjectName());
        dto.setStatus(project.getStatus() != null ? project.getStatus().name() : "ACTIVE");
        dto.setTotalContractValue(project.getBudget() != null ? project.getBudget() : BigDecimal.ZERO);

        List<WorkAssignment> assignments = assignmentRepository.findByProjectId(project.getId());
        dto.setTotalAssignments(assignments.size());

        long approvedCount = 0;
        long pendingReviews = 0;
        long overdue = 0;
        LocalDate today = LocalDate.now();

        for (WorkAssignment a : assignments) {
            if (a.getStatus() == AssignmentStatus.COMPLETED && a.getReleaseStatus() == ReleaseStatus.RELEASED) {
                var decision = decisionRepository.findFirstByAssignmentIdOrderByDecidedAtDesc(a.getId());
                if (decision.isPresent() && decision.get().getDecisionType() == ReviewDecisionType.APPROVED) {
                    approvedCount++;
                }
            }
            if (a.getStatus() == AssignmentStatus.SUBMITTED_FOR_REVIEW) {
                pendingReviews++;
            }
            if (a.getStatus() != AssignmentStatus.COMPLETED && a.getTargetEndDate() != null && a.getTargetEndDate().isBefore(today)) {
                overdue++;
            }

            // Work type distribution
            if (a.getWorkType() != null) {
                String wt = a.getWorkType().name();
                dto.getWorkTypeDistribution().put(wt, dto.getWorkTypeDistribution().getOrDefault(wt, 0L) + 1);
            }
        }

        dto.setApprovedAssignments(approvedCount);
        dto.setPendingInspections(pendingReviews);
        dto.setOverdueAssignments(overdue);

        BigDecimal completionRate = !assignments.isEmpty()
                ? BigDecimal.valueOf(approvedCount * 100.0 / assignments.size()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setCompletionRate(completionRate);

        // Zone status distribution
        List<WorkZone> zones = workZoneRepository.findByProjectId(project.getId());
        for (WorkZone z : zones) {
            String zs = z.getStatus() != null ? z.getStatus().name() : "ACTIVE";
            dto.getZoneStatusDistribution().put(zs, dto.getZoneStatusDistribution().getOrDefault(zs, 0L) + 1);
        }

        // Milestones progress
        List<ProjectMilestone> milestones = milestoneRepository.findByProjectIdOrderBySequenceNumberAsc(project.getId());
        long completedMilestones = milestones.stream().filter(m -> m.getStatus() == MilestoneStatus.PAID).count();
        BigDecimal milestoneProgress = !milestones.isEmpty()
                ? BigDecimal.valueOf(completedMilestones * 100.0 / milestones.size()).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setMilestoneProgressPercentage(milestoneProgress);

        // Financial payments
        List<PaymentAuthorization> auths = authorizationRepository.findByProjectId(project.getId());
        BigDecimal authTotal = auths.stream()
                .map(PaymentAuthorization::getAuthorizedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal settledTotal = auths.stream()
                .filter(pa -> pa.getStatus() == PaymentAuthorizationStatus.SETTLED_SIMULATED)
                .map(PaymentAuthorization::getAuthorizedAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        dto.setAuthorizedPaymentAmount(authTotal);
        dto.setSimulatedSettledAmount(settledTotal);

        return dto;
    }
}
