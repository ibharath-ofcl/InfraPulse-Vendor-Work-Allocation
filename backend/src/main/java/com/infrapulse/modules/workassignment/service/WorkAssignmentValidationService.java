package com.infrapulse.modules.workassignment.service;

import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
public class WorkAssignmentValidationService {

    private static final Logger log = LoggerFactory.getLogger(WorkAssignmentValidationService.class);

    private final ProjectVendorRepository projectVendorRepository;

    public WorkAssignmentValidationService(ProjectVendorRepository projectVendorRepository) {
        this.projectVendorRepository = projectVendorRepository;
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
     * Dedicated boundary for Stage 6 Dependency & Conflict Prevention Engine.
     * In Stage 5, this verifies baseline integrity without blocking legitimate sequential workflows prematurely.
     */
    public void validateAssignmentDependencies(Project project, WorkZone workZone, WorkType workType) {
        log.debug("Executing Stage 5 baseline dependency check for zone: {} and workType: {}", workZone.getZoneCode(), workType);
        // Stage 6 will dynamically inspect prerequisite work packages (e.g. Trenching approval before Road Resurfacing)
    }
}
