package com.infrapulse.modules.workassignment.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;

import com.infrapulse.common.exception.DependencyValidationException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workdependency.dto.BlockedDependencyDetail;
import com.infrapulse.modules.workdependency.dto.SchedulingConflictDetail;
import com.infrapulse.modules.workdependency.dto.ValidationResultResponse;
import com.infrapulse.modules.workdependency.service.WorkConflictDetectionService;
import com.infrapulse.modules.workdependency.service.WorkDependencyService;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class WorkAssignmentValidationService {

    private static final Logger log = LoggerFactory.getLogger(WorkAssignmentValidationService.class);

    private final ProjectVendorRepository projectVendorRepository;
    private final WorkDependencyService workDependencyService;
    private final WorkConflictDetectionService workConflictDetectionService;
    private final AuditService auditService;

    public WorkAssignmentValidationService(
        ProjectVendorRepository projectVendorRepository,
        WorkDependencyService workDependencyService,
        WorkConflictDetectionService workConflictDetectionService,
        AuditService auditService
    ) {
        this.projectVendorRepository = projectVendorRepository;
        this.workDependencyService = workDependencyService;
        this.workConflictDetectionService = workConflictDetectionService;
        this.auditService = auditService;
    }



    public void validateProjectAccess(Project project, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }

        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (project.getProjectManager() == null || !project.getProjectManager().getId().equals(currentUser.getId())) {
                throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: You are not the assigned Project Manager for project: " + project.getProjectName(),
                    Map.of("projectId", "User is not assigned to this project")
                );
            }
            return;
        }

        throw new ApiException(
            HttpStatus.FORBIDDEN,
            "Access denied: Insufficient permissions to manage work assignments for this project.",
            Map.of("role", "User role " + currentUser.getRole() + " cannot allocate work")
        );
    }

    public void validateWorkZone(WorkZone workZone, Project project) {
        if (!workZone.getProject().getId().equals(project.getId())) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Work zone does not belong to the selected project.",
                Map.of("workZoneId", "Work zone " + workZone.getZoneCode() + " belongs to a different project")
            );
        }

        if (workZone.getStatus() == ZoneStatus.INACTIVE) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Work zone is currently inactive and cannot receive new work assignments.",
                Map.of("workZoneId", "Work zone status is INACTIVE")
            );
        }
    }

    public void validateVendorEligibility(Vendor vendor, Project project, WorkType workType) {
        if (vendor.getStatus() != VendorStatus.ACTIVE) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Selected vendor is not active (Status: " + vendor.getStatus() + "). Only active verified vendors can receive work allocations.",
                Map.of("vendorId", "Vendor is not ACTIVE")
            );
        }

        boolean isAssociated = projectVendorRepository.existsByProjectIdAndVendorIdAndAssociationStatus(
            project.getId(),
            vendor.getId(),
            "ACTIVE"
        );

        if (!isAssociated) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "The selected vendor is not associated with this project. Please associate the vendor first in Project Management.",
                Map.of("vendorId", "The selected vendor is not associated with this project.")
            );
        }

        // Validate vendor service category supports this work type
        try {
            ServiceCategory expectedCategory = ServiceCategory.valueOf(workType.name());
            if (!vendor.getServiceCategories().contains(expectedCategory)) {
                throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Vendor '" + vendor.getCompanyName() + "' is not qualified for work category: " + workType.getDisplayName(),
                    Map.of("workType", "Vendor lacks service qualification: " + expectedCategory)
                );
            }
        } catch (IllegalArgumentException e) {
            log.warn("No direct matching ServiceCategory for work type: {}", workType);
        }
    }

    public void validateSchedule(LocalDate plannedStartDate, LocalDate targetEndDate) {
        if (plannedStartDate == null) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Planned start date is mandatory.",
                Map.of("plannedStartDate", "Planned start date is required")
            );
        }

        if (targetEndDate == null) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Target completion date is mandatory.",
                Map.of("targetEndDate", "Target completion date is required")
            );
        }

        if (targetEndDate.isBefore(plannedStartDate)) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Target completion date must not be before the planned start date.",
                Map.of("targetEndDate", "Target completion date must not be before planned start date")
            );
        }
    }

    /**
     * Stage 6: Central validation for prerequisite dependencies.
     * Evaluates active rules in the same project and work zone.
     * Throws DependencyValidationException if any prerequisite is uncompleted or unreleased.
     */
    public void validateAssignmentDependencies(Project project, WorkZone workZone, WorkType workType) {
        log.debug("Executing Stage 6 dependency validation for zone: {} and workType: {}", workZone.getZoneCode(), workType);
        var blocked = workDependencyService.evaluateDependencies(
            project.getId(),
            workZone.getId(),
            workType,
            workZone.getZoneName()
        );

        if (!blocked.isEmpty()) {
            auditService.recordEvent(
                null,
                "ASSIGNMENT_VALIDATION_BLOCKED",
                "WORK_ZONE",
                workZone.getId(),
                "Validation blocked for " + workType.getDisplayName() + " in zone " + workZone.getZoneCode(),
                "Prerequisites not completed/released"
            );

            throw new com.infrapulse.common.exception.DependencyValidationException(
                "DEPENDENCY_NOT_SATISFIED",
                workType.getDisplayName() + " cannot be assigned because prerequisite work has not been released.",
                blocked,
                java.util.List.of()
            );
        }
    }

    /**
     * Stage 6: Central validation for scheduling conflicts and duplicate activities in the same work zone.
     */
    public void validateConflicts(
        Project project,
        WorkZone workZone,
        WorkType workType,
        LocalDate plannedStartDate,
        LocalDate targetEndDate,
        String excludeAssignmentId
    ) {
        log.debug("Executing Stage 6 conflict check for zone: {} and workType: {}", workZone.getZoneCode(), workType);
        var conflicts = workConflictDetectionService.detectConflicts(
            project.getId(),
            workZone.getId(),
            workType,
            plannedStartDate,
            targetEndDate,
            excludeAssignmentId
        );

        if (!conflicts.isEmpty()) {
            auditService.recordEvent(
                null,
                "SCHEDULING_CONFLICT_DETECTED",
                "WORK_ZONE",
                workZone.getId(),
                "Conflict detected for " + workType.getDisplayName() + " in zone " + workZone.getZoneCode(),
                conflicts.get(0).reason()
            );

            throw new com.infrapulse.common.exception.DependencyValidationException(
                "SCHEDULING_CONFLICT",
                "Assignment cannot be created due to scheduling or activity conflicts in work zone: " + workZone.getZoneName(),
                java.util.List.of(),
                conflicts
            );
        }
    }

    /**
     * Stage 6: Structured validation response for the live pre-allocation validation API.
     */
    public com.infrapulse.modules.workdependency.dto.ValidationResultResponse validateAssignmentEligibility(
        Project project,
        WorkZone workZone,
        WorkType workType,
        LocalDate plannedStartDate,
        LocalDate targetEndDate,
        String excludeAssignmentId
    ) {
        var blocked = workDependencyService.evaluateDependencies(
            project.getId(),
            workZone.getId(),
            workType,
            workZone.getZoneName()
        );

        var conflicts = workConflictDetectionService.detectConflicts(
            project.getId(),
            workZone.getId(),
            workType,
            plannedStartDate,
            targetEndDate,
            excludeAssignmentId
        );

        boolean eligible = blocked.isEmpty() && conflicts.isEmpty();
        String status;
        String summary;

        if (!blocked.isEmpty()) {
            status = "BLOCKED";
            summary = workType.getDisplayName() + " cannot be assigned because prerequisite work has not been completed and released.";
        } else if (!conflicts.isEmpty()) {
            status = "CONFLICT";
            summary = "Operational conflict detected in work zone: " + workZone.getZoneName() + ".";
        } else {
            status = "READY";
            summary = "Prerequisites satisfied and operational work zone is clear. Ready for allocation.";
        }

        boolean hasDuplicate = conflicts.stream()
            .anyMatch(c -> "DUPLICATE_ACTIVITY".equals(c.conflictType()));
        String duplicateAssignmentCode = conflicts.stream()
            .filter(c -> "DUPLICATE_ACTIVITY".equals(c.conflictType()))
            .map(com.infrapulse.modules.workdependency.dto.SchedulingConflictDetail::assignmentCode)
            .findFirst()
            .orElse(null);


        return new com.infrapulse.modules.workdependency.dto.ValidationResultResponse(
            eligible,
            status,
            summary,
            blocked,
            conflicts,
            hasDuplicate,
            duplicateAssignmentCode
        );
    }
}


