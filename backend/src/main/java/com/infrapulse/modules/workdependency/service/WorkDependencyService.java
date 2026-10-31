package com.infrapulse.modules.workdependency.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workdependency.dto.BlockedDependencyDetail;
import com.infrapulse.modules.workdependency.dto.CreateDependencyRequest;
import com.infrapulse.modules.workdependency.dto.UpdateDependencyRequest;
import com.infrapulse.modules.workdependency.dto.WorkTypeDependencyResponse;
import com.infrapulse.modules.workdependency.entity.WorkTypeDependency;
import com.infrapulse.modules.workdependency.repository.WorkTypeDependencyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class WorkDependencyService {

    private static final Logger log = LoggerFactory.getLogger(WorkDependencyService.class);

    private final WorkTypeDependencyRepository dependencyRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    public WorkDependencyService(
        WorkTypeDependencyRepository dependencyRepository,
        WorkAssignmentRepository workAssignmentRepository,
        ProjectRepository projectRepository,
        AuditService auditService
    ) {
        this.dependencyRepository = dependencyRepository;
        this.workAssignmentRepository = workAssignmentRepository;
        this.projectRepository = projectRepository;
        this.auditService = auditService;
    }

    /**
     * Evaluates dependencies for requested work type strictly within the same project and same work zone.
     * Prerequisite activities from other work zones or other projects NEVER satisfy dependencies.
     */
    @Transactional(readOnly = true)
    public List<BlockedDependencyDetail> evaluateDependencies(
        String projectId,
        String workZoneId,
        WorkType workType,
        String workZoneName
    ) {
        List<BlockedDependencyDetail> blockedList = new ArrayList<>();
        List<WorkTypeDependency> chain = getFullDependencyChain(projectId, workType);

        if (chain.isEmpty()) {
            log.debug("No active dependency rules found for workType: {} in project: {}", workType, projectId);
            return blockedList;
        }

        // Evaluate each required predecessor rule in the chain
        Set<WorkType> evaluatedPredecessors = new HashSet<>();

        for (WorkTypeDependency rule : chain) {
            WorkType pred = rule.getPredecessorWorkType();
            if (!evaluatedPredecessors.add(pred)) {
                continue;
            }

            // Must query strictly by same projectId, same workZoneId and predecessor workType
            List<WorkAssignment> matchingAssignments = workAssignmentRepository
                .findByProjectIdAndWorkZoneIdAndWorkType(projectId, workZoneId, pred);

            if (matchingAssignments.isEmpty()) {
                blockedList.add(new BlockedDependencyDetail(
                    pred,
                    pred.getDisplayName(),
                    null,
                    null,
                    null,
                    workZoneId,
                    workZoneName,
                    null,
                    "Required prerequisite " + pred.getDisplayName() + " has not been assigned in this work zone.",
                    "Assign, complete, and obtain authorized release clearance for " + pred.getDisplayName() + "."
                ));
            } else {
                // Find most relevant assignment (prefer latest COMPLETED, or latest created)
                WorkAssignment targetAssignment = matchingAssignments.stream()
                    .filter(a -> a.getStatus() == AssignmentStatus.COMPLETED)
                    .findFirst()
                    .orElse(matchingAssignments.get(0));

                AssignmentStatus currentStatus = targetAssignment.getStatus();
                ReleaseStatus currentReleaseStatus = targetAssignment.getReleaseStatus();
                String vendorName = targetAssignment.getVendor() != null ? targetAssignment.getVendor().getCompanyName() : null;

                if (currentStatus != rule.getRequiredPredecessorStatus()) {
                    blockedList.add(new BlockedDependencyDetail(
                        pred,
                        pred.getDisplayName(),
                        targetAssignment.getAssignmentCode(),
                        currentStatus,
                        currentReleaseStatus != null ? currentReleaseStatus : ReleaseStatus.PENDING_RELEASE,
                        workZoneId,
                        workZoneName,
                        vendorName,
                        "Required prerequisite " + pred.getDisplayName() + " (" + targetAssignment.getAssignmentCode() +
                        ") is currently " + currentStatus + ", but required status is " + rule.getRequiredPredecessorStatus() + ".",
                        "Vendor must complete the assignment and an authorized engineer must release it."
                    ));
                } else if (rule.isRequiresReleaseApproval() && currentReleaseStatus != ReleaseStatus.RELEASED) {
                    if (currentReleaseStatus == ReleaseStatus.REJECTED) {
                        blockedList.add(new BlockedDependencyDetail(
                            pred,
                            pred.getDisplayName(),
                            targetAssignment.getAssignmentCode(),
                            currentStatus,
                            ReleaseStatus.REJECTED,
                            workZoneId,
                            workZoneName,
                            vendorName,
                            "Prerequisite " + pred.getDisplayName() + " (" + targetAssignment.getAssignmentCode() +
                            ") release clearance was REJECTED: " +
                            (targetAssignment.getReleaseNotes() != null ? targetAssignment.getReleaseNotes() : "No notes provided."),
                            "Rework must be completed and authorized release clearance must be granted."
                        ));
                    } else {
                        blockedList.add(new BlockedDependencyDetail(
                            pred,
                            pred.getDisplayName(),
                            targetAssignment.getAssignmentCode(),
                            currentStatus,
                            ReleaseStatus.PENDING_RELEASE,
                            workZoneId,
                            workZoneName,
                            vendorName,
                            "Prerequisite " + pred.getDisplayName() + " (" + targetAssignment.getAssignmentCode() +
                            ") is completed but awaiting authorized operational clearance (PENDING_RELEASE).",
                            "An authorized Field Engineer or Project Manager must review and record a release approval."
                        ));
                    }
                }
            }

        }

        return blockedList;
    }

    /**
     * Traverses recursive predecessor dependencies for a requested work type.
     */
    public List<WorkTypeDependency> getFullDependencyChain(String projectId, WorkType targetWorkType) {
        List<WorkTypeDependency> chain = new ArrayList<>();
        Set<WorkType> visited = new HashSet<>();
        collectRulesRecursively(projectId, targetWorkType, chain, visited);
        return chain;
    }

    private void collectRulesRecursively(
        String projectId,
        WorkType current,
        List<WorkTypeDependency> chain,
        Set<WorkType> visited
    ) {
        if (!visited.add(current)) {
            return;
        }
        List<WorkTypeDependency> direct = dependencyRepository.findApplicableRules(projectId, current);
        for (WorkTypeDependency dep : direct) {
            chain.add(dep);
            collectRulesRecursively(projectId, dep.getPredecessorWorkType(), chain, visited);
        }
    }

    @Transactional(readOnly = true)
    public List<WorkTypeDependencyResponse> getApplicableRules(String projectId, WorkType successorWorkType) {
        List<WorkTypeDependency> rules = successorWorkType != null
            ? dependencyRepository.findApplicableRules(projectId, successorWorkType)
            : dependencyRepository.findAllApplicableRules(projectId);
        return rules.stream().map(WorkTypeDependencyResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Page<WorkTypeDependencyResponse> getAllRules(String projectId, Boolean isActive, Pageable pageable) {
        Page<WorkTypeDependency> page;
        if (projectId != null && !projectId.isBlank()) {
            page = dependencyRepository.findByProjectId(projectId, pageable);
        } else if (isActive != null) {
            page = dependencyRepository.findByIsActive(isActive, pageable);
        } else {
            page = dependencyRepository.findAll(pageable);
        }
        return page.map(WorkTypeDependencyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WorkTypeDependencyResponse getRuleById(String id) {
        WorkTypeDependency dep = dependencyRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dependency rule not found: " + id));
        return WorkTypeDependencyResponse.fromEntity(dep);
    }

    @Transactional
    public WorkTypeDependencyResponse createRule(CreateDependencyRequest request, User currentUser) {
        Project project = null;
        if (request.projectId() != null && !request.projectId().isBlank()) {
            project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found: " + request.projectId()));
        }

        if (request.predecessorWorkType() == request.successorWorkType()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Predecessor and successor work types cannot be the same.");
        }

        boolean exists = dependencyRepository.existsBySuccessorWorkTypeAndPredecessorWorkTypeAndProjectId(
            request.successorWorkType(),
            request.predecessorWorkType(),
            project != null ? project.getId() : null
        );
        if (exists) {
            throw new ApiException(HttpStatus.CONFLICT, "A dependency rule already exists between these work types for this scope.");
        }

        WorkTypeDependency rule = new WorkTypeDependency(
            UUID.randomUUID().toString(),
            project,
            request.predecessorWorkType(),
            request.successorWorkType(),
            request.requiredPredecessorStatus() != null ? request.requiredPredecessorStatus() : AssignmentStatus.COMPLETED,
            request.requiresReleaseApproval() != null ? request.requiresReleaseApproval() : true,
            request.isActive() != null ? request.isActive() : true,
            request.priority() != null ? request.priority() : 1,
            request.description()
        );

        WorkTypeDependency saved = dependencyRepository.save(rule);

        auditService.logEvent(
            currentUser,
            "DEPENDENCY_RULE_CREATED",
            "WORK_TYPE_DEPENDENCY",
            saved.getId(),
            "Created dependency rule: " + saved.getPredecessorWorkType() + " -> " + saved.getSuccessorWorkType(),
            "Initial setup by administrator"
        );

        return WorkTypeDependencyResponse.fromEntity(saved);
    }

    @Transactional
    public WorkTypeDependencyResponse updateRule(String id, UpdateDependencyRequest request, User currentUser) {
        WorkTypeDependency rule = dependencyRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dependency rule not found: " + id));

        if (request.requiredPredecessorStatus() != null) {
            rule.setRequiredPredecessorStatus(request.requiredPredecessorStatus());
        }
        if (request.requiresReleaseApproval() != null) {
            rule.setRequiresReleaseApproval(request.requiresReleaseApproval());
        }
        if (request.isActive() != null) {
            rule.setActive(request.isActive());
        }
        if (request.priority() != null) {
            rule.setPriority(request.priority());
        }
        if (request.description() != null) {
            rule.setDescription(request.description());
        }

        WorkTypeDependency saved = dependencyRepository.save(rule);

        auditService.logEvent(
            currentUser,
            "DEPENDENCY_RULE_UPDATED",
            "WORK_TYPE_DEPENDENCY",
            saved.getId(),
            "Updated dependency rule: " + saved.getPredecessorWorkType() + " -> " + saved.getSuccessorWorkType(),
            "Modified by administrator"
        );

        return WorkTypeDependencyResponse.fromEntity(saved);
    }

    @Transactional
    public WorkTypeDependencyResponse toggleRuleStatus(String id, boolean active, User currentUser) {
        WorkTypeDependency rule = dependencyRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dependency rule not found: " + id));

        rule.setActive(active);
        WorkTypeDependency saved = dependencyRepository.save(rule);

        auditService.logEvent(
            currentUser,
            active ? "DEPENDENCY_RULE_ACTIVATED" : "DEPENDENCY_RULE_DEACTIVATED",
            "WORK_TYPE_DEPENDENCY",
            saved.getId(),
            "Rule " + saved.getId() + " active status set to: " + active,
            "Status toggle"
        );

        return WorkTypeDependencyResponse.fromEntity(saved);
    }
}
