package com.infrapulse.modules.workassignment.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.dto.UserSummaryDto;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.dto.CancelAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.CreateWorkAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.UpdateAssignmentStatusRequest;
import com.infrapulse.modules.workassignment.dto.UpdateWorkAssignmentRequest;
import com.infrapulse.modules.workassignment.dto.WorkAssignmentResponse;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workdependency.dto.AssignmentValidationRequest;
import com.infrapulse.modules.workdependency.dto.PrerequisiteReleaseRequest;
import com.infrapulse.modules.workdependency.dto.ValidationResultResponse;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.*;

@Service
public class WorkAssignmentService {

    private final WorkAssignmentRepository workAssignmentRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final VendorRepository vendorRepository;
    private final WorkAssignmentValidationService validationService;
    private final AuditService auditService;

    public WorkAssignmentService(
        WorkAssignmentRepository workAssignmentRepository,
        ProjectRepository projectRepository,
        WorkZoneRepository workZoneRepository,
        VendorRepository vendorRepository,
        WorkAssignmentValidationService validationService,
        AuditService auditService
    ) {
        this.workAssignmentRepository = workAssignmentRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.vendorRepository = vendorRepository;
        this.validationService = validationService;
        this.auditService = auditService;
    }

    @Transactional
    public WorkAssignmentResponse createAssignment(CreateWorkAssignmentRequest request, User currentUser) {
        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Project not found with ID: " + request.projectId(),
                Map.of("projectId", "Project does not exist")
            ));

        validationService.validateProjectAccess(project, currentUser);

        // Stage 6 Concurrency Protection: Acquire pessimistic row lock on WorkZone to serialize concurrent allocations
        WorkZone workZone = workZoneRepository.findByIdWithLock(request.workZoneId())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work zone not found with ID: " + request.workZoneId(),
                Map.of("workZoneId", "Work zone does not exist")
            ));

        validationService.validateWorkZone(workZone, project);

        Vendor vendor = vendorRepository.findById(request.vendorId())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Vendor not found with ID: " + request.vendorId(),
                Map.of("vendorId", "Vendor does not exist")
            ));

        validationService.validateVendorEligibility(vendor, project, request.workType());
        validationService.validateSchedule(request.plannedStartDate(), request.targetEndDate());

        // Stage 6: Central Dependency & Conflict Validations executed within the serialized locked transaction
        validationService.validateAssignmentDependencies(project, workZone, request.workType());
        validationService.validateConflicts(project, workZone, request.workType(), request.plannedStartDate(), request.targetEndDate(), null);

        // Concurrency-safe assignment code generation
        String assignmentCode = generateAssignmentCode();

        WorkAssignment assignment = new WorkAssignment(
            UUID.randomUUID().toString(),
            assignmentCode,
            project,
            workZone,
            vendor,
            request.workType(),
            request.title().trim(),
            request.description(),
            request.plannedStartDate(),
            request.targetEndDate(),
            request.priority() != null ? request.priority() : AssignmentPriority.MEDIUM,
            AssignmentStatus.ASSIGNED,
            request.instructions(),
            currentUser
        );
        assignment.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);

        WorkAssignment saved = workAssignmentRepository.save(assignment);

        // Update zone status to ACTIVE if currently AVAILABLE
        if (workZone.getStatus() == ZoneStatus.AVAILABLE) {
            workZone.setStatus(ZoneStatus.ACTIVE);
            workZoneRepository.save(workZone);
        }

        auditService.logEvent(
            currentUser,
            "WORK_ASSIGNMENT_CREATED",
            "WORK_ASSIGNMENT",
            saved.getId(),
            "Allocated " + saved.getWorkType().getDisplayName() + " (" + saved.getAssignmentCode() + ") to " + vendor.getCompanyName() + " in zone " + workZone.getZoneCode(),
            "Passed all dependency and conflict validations"
        );

        return mapToResponse(saved);
    }


    @Transactional(readOnly = true)
    public Page<WorkAssignmentResponse> getAssignments(
        String projectId,
        String workZoneId,
        String pincode,
        String vendorId,
        WorkType workType,
        AssignmentStatus status,
        AssignmentPriority priority,
        LocalDate startDateFrom,
        LocalDate startDateTo,
        String search,
        Pageable pageable,
        User currentUser
    ) {
        Specification<WorkAssignment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Scoping based on authenticated user role
            if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
                predicates.add(cb.equal(root.get("project").get("projectManager").get("id"), currentUser.getId()));
            } else if (currentUser.getRole() == UserRole.VENDOR) {
                Optional<Vendor> vendorOpt = vendorRepository.findByUserId(currentUser.getId());
                if (vendorOpt.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(cb.equal(root.get("vendor").get("id"), vendorOpt.get().getId()));
                }
            }

            if (projectId != null && !projectId.isBlank() && !"ALL".equalsIgnoreCase(projectId)) {
                predicates.add(cb.equal(root.get("project").get("id"), projectId));
            }

            if (workZoneId != null && !workZoneId.isBlank()) {
                predicates.add(cb.equal(root.get("workZone").get("id"), workZoneId));
            }

            if (pincode != null && !pincode.isBlank()) {
                predicates.add(cb.equal(root.get("workZone").get("pincode"), pincode.trim()));
            }

            if (vendorId != null && !vendorId.isBlank()) {
                predicates.add(cb.equal(root.get("vendor").get("id"), vendorId));
            }

            if (workType != null) {
                predicates.add(cb.equal(root.get("workType"), workType));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (startDateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("plannedStartDate"), startDateFrom));
            }

            if (startDateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("plannedStartDate"), startDateTo));
            }

            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("assignmentCode")), term);
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate zoneMatch = cb.like(cb.lower(root.get("workZone").get("zoneName")), term);
                Predicate vendorMatch = cb.like(cb.lower(root.get("vendor").get("companyName")), term);
                Predicate pinMatch = cb.like(root.get("workZone").get("pincode"), term);
                predicates.add(cb.or(codeMatch, titleMatch, zoneMatch, vendorMatch, pinMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return workAssignmentRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public WorkAssignmentResponse getAssignmentById(String id, User currentUser) {
        WorkAssignment assignment = workAssignmentRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work assignment not found with ID: " + id,
                Map.of("id", "Assignment does not exist")
            ));

        validateAssignmentAccess(assignment, currentUser);

        return mapToResponse(assignment);
    }

    @Transactional
    public WorkAssignmentResponse updateAssignment(String id, UpdateWorkAssignmentRequest request, User currentUser) {
        WorkAssignment assignment = workAssignmentRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work assignment not found with ID: " + id,
                Map.of("id", "Assignment does not exist")
            ));

        validationService.validateProjectAccess(assignment.getProject(), currentUser);

        if (assignment.getStatus() == AssignmentStatus.COMPLETED || assignment.getStatus() == AssignmentStatus.CANCELLED) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Cannot modify an assignment that is in terminal status: " + assignment.getStatus(),
                Map.of("status", "Assignment is " + assignment.getStatus())
            );
        }

        validationService.validateSchedule(request.plannedStartDate(), request.targetEndDate());

        assignment.setTitle(request.title().trim());
        assignment.setDescription(request.description());
        assignment.setPlannedStartDate(request.plannedStartDate());
        assignment.setTargetEndDate(request.targetEndDate());
        assignment.setPriority(request.priority());
        assignment.setInstructions(request.instructions());

        WorkAssignment updated = workAssignmentRepository.save(assignment);

        auditService.logEvent(
            currentUser,
            "WORK_ASSIGNMENT_UPDATED",
            "WORK_ASSIGNMENT",
            updated.getId(),
            "Updated work assignment details for " + updated.getAssignmentCode(),
            null
        );

        return mapToResponse(updated);
    }

    @Transactional
    public WorkAssignmentResponse updateAssignmentStatus(String id, UpdateAssignmentStatusRequest request, User currentUser) {
        WorkAssignment assignment = workAssignmentRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work assignment not found with ID: " + id,
                Map.of("id", "Assignment does not exist")
            ));

        AssignmentStatus targetStatus = request.status();
        AssignmentStatus currentStatus = assignment.getStatus();

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Invalid status transition from " + currentStatus + " to " + targetStatus + ". Allowed transitions: " + currentStatus.getAllowedTransitions(),
                Map.of("status", "Cannot transition from " + currentStatus + " to " + targetStatus)
            );
        }

        // Role-based status transition restrictions
        if (currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vendorOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vendorOpt.isEmpty() || !vendorOpt.get().getId().equals(assignment.getVendor().getId())) {
                throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: Vendors can only update the status of their own work assignments.",
                    Map.of("vendorId", "Vendor does not own this assignment")
                );
            }

            // Vendor permitted transitions: ACCEPTED, REJECTED, IN_PROGRESS
            if (targetStatus == AssignmentStatus.ACCEPTED) {
                if (currentStatus != AssignmentStatus.ASSIGNED) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Only newly assigned work packages can be accepted.", Map.of("status", "Current status is " + currentStatus));
                }
            } else if (targetStatus == AssignmentStatus.REJECTED) {
                if (currentStatus != AssignmentStatus.ASSIGNED) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Only assigned packages can be rejected.", Map.of("status", "Current status is " + currentStatus));
                }
                if (request.reason() == null || request.reason().isBlank()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "A reason must be provided when rejecting an assignment.", Map.of("reason", "Rejection reason is required"));
                }
                assignment.setRejectionReason(request.reason().trim());
            } else if (targetStatus == AssignmentStatus.IN_PROGRESS) {
                if (currentStatus != AssignmentStatus.ACCEPTED) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Work can only be started on an accepted assignment.", Map.of("status", "Assignment is not in ACCEPTED status"));
                }
                assignment.setActualStartDate(LocalDate.now());
            } else if (targetStatus == AssignmentStatus.SUBMITTED_FOR_REVIEW) {
                if (currentStatus != AssignmentStatus.IN_PROGRESS) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Only work currently in progress can be submitted for completion review.", Map.of("status", "Current status is " + currentStatus));
                }
                assignment.setActualEndDate(LocalDate.now());
                assignment.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
            } else {
                throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Vendors cannot directly set assignment status to " + targetStatus + ". Please use the completion review workflow.",
                    Map.of("status", "Unauthorized status change for vendor")
                );
            }
        } else {
            // Administrative roles
            validationService.validateProjectAccess(assignment.getProject(), currentUser);

            if (targetStatus == AssignmentStatus.IN_PROGRESS && assignment.getActualStartDate() == null) {
                assignment.setActualStartDate(LocalDate.now());
            } else if (targetStatus == AssignmentStatus.COMPLETED) {
                assignment.setActualEndDate(LocalDate.now());
            }
        }

        assignment.setStatus(targetStatus);
        WorkAssignment updated = workAssignmentRepository.save(assignment);

        String eventType = switch (targetStatus) {
            case ACCEPTED -> "VENDOR_ACCEPTED_ASSIGNMENT";
            case REJECTED -> "VENDOR_REJECTED_ASSIGNMENT";
            case IN_PROGRESS -> "WORK_STARTED";
            case SUBMITTED_FOR_REVIEW -> "PREREQUISITE_WORK_SUBMITTED_FOR_COMPLETION";
            default -> "WORK_ASSIGNMENT_STATUS_CHANGED";
        };

        auditService.logEvent(
            currentUser,
            eventType,
            "WORK_ASSIGNMENT",
            updated.getId(),
            "Changed assignment " + updated.getAssignmentCode() + " status from " + currentStatus + " to " + targetStatus,
            request.reason()
        );

        return mapToResponse(updated);
    }

    @Transactional
    public WorkAssignmentResponse cancelAssignment(String id, CancelAssignmentRequest request, User currentUser) {
        WorkAssignment assignment = workAssignmentRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work assignment not found with ID: " + id,
                Map.of("id", "Assignment does not exist")
            ));

        validationService.validateProjectAccess(assignment.getProject(), currentUser);

        if (assignment.getStatus() == AssignmentStatus.COMPLETED) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Cannot cancel an assignment that has already been completed.",
                Map.of("status", "Assignment is COMPLETED")
            );
        }

        AssignmentStatus oldStatus = assignment.getStatus();
        assignment.setStatus(AssignmentStatus.CANCELLED);
        assignment.setCancellationReason(request.reason().trim());

        WorkAssignment updated = workAssignmentRepository.save(assignment);

        auditService.logEvent(
            currentUser,
            "WORK_ASSIGNMENT_CANCELLED",
            "WORK_ASSIGNMENT",
            updated.getId(),
            "Cancelled assignment " + updated.getAssignmentCode() + " (Previous status: " + oldStatus + ")",
            request.reason()
        );

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public Page<WorkAssignmentResponse> getVendorAssignments(Pageable pageable, User currentUser) {
        Optional<Vendor> vendorOpt = vendorRepository.findByUserId(currentUser.getId());
        if (vendorOpt.isEmpty()) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                "No registered vendor profile is associated with your user account. Please contact an administrator.",
                Map.of("user", "User is not mapped to a vendor record")
            );
        }

        Vendor vendor = vendorOpt.get();
        Specification<WorkAssignment> spec = (root, query, cb) -> cb.equal(root.get("vendor").get("id"), vendor.getId());

        return workAssignmentRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ValidationResultResponse validateAssignment(AssignmentValidationRequest request, User currentUser) {
        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Project not found with ID: " + request.projectId(),
                Map.of("projectId", "Project does not exist")
            ));

        validationService.validateProjectAccess(project, currentUser);

        WorkZone workZone = workZoneRepository.findById(request.workZoneId())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work zone not found with ID: " + request.workZoneId(),
                Map.of("workZoneId", "Work zone does not exist")
            ));

        validationService.validateWorkZone(workZone, project);

        return validationService.validateAssignmentEligibility(
            project,
            workZone,
            request.workType(),
            request.plannedStartDate(),
            request.targetEndDate(),
            null
        );
    }

    @Transactional
    public WorkAssignmentResponse releasePrerequisite(String id, PrerequisiteReleaseRequest request, User currentUser) {
        WorkAssignment assignment = workAssignmentRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work assignment not found with ID: " + id,
                Map.of("id", "Assignment does not exist")
            ));

        // 1. Vendors cannot approve or release prerequisite work
        if (currentUser.getRole() == UserRole.VENDOR) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                "Access denied: Vendors are strictly forbidden from approving or releasing prerequisite work.",
                Map.of("role", "Vendors cannot release prerequisite work")
            );
        }

        // 2. Prevent vendor self-release if user is linked to vendor
        if (assignment.getVendor() != null && assignment.getVendor().getUser() != null &&
            assignment.getVendor().getUser().getId().equals(currentUser.getId())) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                "Access denied: Operational clearance cannot be granted by the executing vendor.",
                Map.of("vendor", "Vendor cannot self-approve work")
            );
        }

        // 3. Project scope check (prevent IDOR)
        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (assignment.getProject().getProjectManager() == null ||
                !assignment.getProject().getProjectManager().getId().equals(currentUser.getId())) {
                throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: You are not the assigned Project Manager for this project.",
                    Map.of("projectId", "Cannot release assignments in unauthorized projects")
                );
            }
        }

        if (request.notes() == null || request.notes().trim().isBlank()) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "A mandatory review note or justification is required to record a prerequisite release decision.",
                Map.of("notes", "Review notes cannot be empty")
            );
        }

        ReleaseStatus decision = request.decision();
        if (decision == null || decision == ReleaseStatus.PENDING_RELEASE) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Release decision must be either RELEASED or REJECTED.",
                Map.of("decision", "Invalid release decision")
            );
        }

        assignment.setReleaseStatus(decision);
        assignment.setReleasedBy(currentUser);
        assignment.setReleasedAt(Instant.now());
        assignment.setReleaseNotes(request.notes().trim());

        if (decision == ReleaseStatus.RELEASED) {
            if (assignment.getStatus() != AssignmentStatus.COMPLETED) {
                assignment.setStatus(AssignmentStatus.COMPLETED);
                if (assignment.getActualEndDate() == null) {
                    assignment.setActualEndDate(LocalDate.now());
                }
            }
        }

        WorkAssignment saved = workAssignmentRepository.save(assignment);

        String eventType = decision == ReleaseStatus.RELEASED
            ? "PREREQUISITE_RELEASE_APPROVED"
            : "PREREQUISITE_RELEASE_REJECTED";

        auditService.logEvent(
            currentUser,
            eventType,
            "WORK_ASSIGNMENT",
            saved.getId(),
            "Prerequisite release decision: " + decision + " for " + saved.getAssignmentCode() + " (" + saved.getWorkType().getDisplayName() + ")",
            request.notes().trim()
        );

        return mapToResponse(saved);
    }

    private void validateAssignmentAccess(WorkAssignment assignment, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }

        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (assignment.getProject().getProjectManager() != null && assignment.getProject().getProjectManager().getId().equals(currentUser.getId())) {
                return;
            }
        } else if (currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vendorOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vendorOpt.isPresent() && vendorOpt.get().getId().equals(assignment.getVendor().getId())) {
                return;
            }
        } else if (currentUser.getRole() == UserRole.FIELD_ENGINEER || currentUser.getRole() == UserRole.FINANCE_OFFICER) {
            return;
        }

        throw new ApiException(
            HttpStatus.FORBIDDEN,
            "Access denied: You do not have permission to view this work assignment.",
            Map.of("assignmentId", "Access restricted")
        );
    }

    private String generateAssignmentCode() {
        int year = Year.now().getValue();
        Long nextVal;
        try {
            nextVal = workAssignmentRepository.getNextAssignmentSequence();
        } catch (Exception e) {
            nextVal = (long) (Math.random() * 900000 + 100000);
        }
        String code = String.format("INF-WA-%d-%06d", year, nextVal);
        int retry = 0;
        while (workAssignmentRepository.existsByAssignmentCode(code) && retry < 10) {
            code = String.format("INF-WA-%d-%06d", year, (long) (Math.random() * 900000 + 100000));
            retry++;
        }
        return code;
    }

    private WorkAssignmentResponse mapToResponse(WorkAssignment asn) {
        UserSummaryDto creatorDto = new UserSummaryDto(
            asn.getCreatedBy().getId(),
            asn.getCreatedBy().getFullName(),
            asn.getCreatedBy().getEmail(),
            asn.getCreatedBy().getRole().name()
        );

        UserSummaryDto releaserDto = asn.getReleasedBy() != null ? new UserSummaryDto(
            asn.getReleasedBy().getId(),
            asn.getReleasedBy().getFullName(),
            asn.getReleasedBy().getEmail(),
            asn.getReleasedBy().getRole().name()
        ) : null;

        return new WorkAssignmentResponse(
            asn.getId(),
            asn.getAssignmentCode(),
            asn.getProject().getId(),
            asn.getProject().getProjectCode(),
            asn.getProject().getProjectName(),
            asn.getWorkZone().getId(),
            asn.getWorkZone().getZoneCode(),
            asn.getWorkZone().getZoneName(),
            asn.getWorkZone().getPincode(),
            asn.getWorkZone().getLocality(),
            asn.getVendor().getId(),
            asn.getVendor().getVendorCode(),
            asn.getVendor().getCompanyName(),
            asn.getWorkType(),
            asn.getWorkType().getDisplayName(),
            asn.getTitle(),
            asn.getDescription(),
            asn.getPlannedStartDate(),
            asn.getTargetEndDate(),
            asn.getActualStartDate(),
            asn.getActualEndDate(),
            asn.getPriority(),
            asn.getStatus(),
            asn.getInstructions(),
            asn.getCancellationReason(),
            asn.getRejectionReason(),
            asn.getReleaseStatus(),
            releaserDto,
            asn.getReleasedAt(),
            asn.getReleaseNotes(),
            creatorDto,
            asn.getCreatedAt(),
            asn.getUpdatedAt()
        );
    }
}

