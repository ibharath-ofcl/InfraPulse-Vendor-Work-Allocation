package com.infrapulse.modules.workzone.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workzone.dto.CreateWorkZoneRequest;
import com.infrapulse.modules.workzone.dto.UpdateWorkZoneRequest;
import com.infrapulse.modules.workzone.dto.UpdateZoneStatusRequest;
import com.infrapulse.modules.workzone.dto.WorkZoneResponse;
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
import java.util.*;

@Service
public class WorkZoneService {

    private final WorkZoneRepository workZoneRepository;
    private final ProjectRepository projectRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final VendorRepository vendorRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final AuditService auditService;

    public WorkZoneService(
        WorkZoneRepository workZoneRepository,
        ProjectRepository projectRepository,
        ProjectVendorRepository projectVendorRepository,
        VendorRepository vendorRepository,
        WorkAssignmentRepository workAssignmentRepository,
        AuditService auditService
    ) {
        this.workZoneRepository = workZoneRepository;
        this.projectRepository = projectRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.vendorRepository = vendorRepository;
        this.workAssignmentRepository = workAssignmentRepository;
        this.auditService = auditService;
    }

    @Transactional
    public WorkZoneResponse createWorkZone(CreateWorkZoneRequest request, User currentUser) {
        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Project not found with ID: " + request.projectId(),
                Map.of("projectId", "Project does not exist")
            ));

        validateProjectAccess(project, currentUser);

        if (project.getStatus() == ProjectStatus.COMPLETED || project.getStatus() == ProjectStatus.CANCELLED) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "Cannot create work zone: Project " + project.getProjectCode() + " is " + project.getStatus(),
                Map.of("project", "Project is " + project.getStatus())
            );
        }

        // Generate unique zone code: e.g. WZ-600040-001
        String zoneCode = generateZoneCode(request.pincode());

        WorkZone workZone = new WorkZone(
            UUID.randomUUID().toString(),
            zoneCode,
            project,
            request.zoneName().trim(),
            request.description(),
            request.pincode().trim(),
            request.locality().trim(),
            request.district().trim(),
            request.state().trim(),
            request.centerLatitude(),
            request.centerLongitude(),
            ZoneStatus.AVAILABLE,
            currentUser
        );

        WorkZone saved = workZoneRepository.save(workZone);

        auditService.logEvent(
            currentUser,
            "WORK_ZONE_CREATED",
            "WORK_ZONE",
            saved.getId(),
            "Created spatial work zone '" + saved.getZoneName() + "' (" + saved.getZoneCode() + ") under project " + project.getProjectCode(),
            null
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<WorkZoneResponse> getWorkZones(
        String projectId,
        String pincode,
        ZoneStatus status,
        String locality,
        String search,
        Pageable pageable,
        User currentUser
    ) {
        Specification<WorkZone> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Role-based scoping
            if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
                predicates.add(cb.equal(root.get("project").get("projectManager").get("id"), currentUser.getId()));
            } else if (currentUser.getRole() == UserRole.VENDOR) {
                // Find vendor for this user
                Optional<Vendor> vendorOpt = vendorRepository.findByUserId(currentUser.getId());
                if (vendorOpt.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    List<String> accessibleProjectIds = projectVendorRepository
                        .findByVendorIdAndAssociationStatus(vendorOpt.get().getId(), "ACTIVE")
                        .stream()
                        .map(pv -> pv.getProject().getId())
                        .toList();
                    if (accessibleProjectIds.isEmpty()) {
                        predicates.add(cb.disjunction());
                    } else {
                        predicates.add(root.get("project").get("id").in(accessibleProjectIds));
                    }
                }
            }

            if (projectId != null && !projectId.isBlank() && !"ALL".equalsIgnoreCase(projectId)) {
                predicates.add(cb.equal(root.get("project").get("id"), projectId));
            }

            if (pincode != null && !pincode.isBlank()) {
                predicates.add(cb.equal(root.get("pincode"), pincode.trim()));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (locality != null && !locality.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("locality")), "%" + locality.toLowerCase().trim() + "%"));
            }

            if (search != null && !search.isBlank()) {
                String term = "%" + search.toLowerCase().trim() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("zoneName")), term);
                Predicate codeMatch = cb.like(cb.lower(root.get("zoneCode")), term);
                Predicate pinMatch = cb.like(root.get("pincode"), term);
                Predicate locMatch = cb.like(cb.lower(root.get("locality")), term);
                predicates.add(cb.or(nameMatch, codeMatch, pinMatch, locMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return workZoneRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public WorkZoneResponse getWorkZoneById(String id, User currentUser) {
        WorkZone workZone = workZoneRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work zone not found with ID: " + id,
                Map.of("id", "Work zone does not exist")
            ));

        validateProjectReadAccess(workZone.getProject(), currentUser);

        return mapToResponse(workZone);
    }

    @Transactional
    public WorkZoneResponse updateWorkZone(String id, UpdateWorkZoneRequest request, User currentUser) {
        WorkZone workZone = workZoneRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work zone not found with ID: " + id,
                Map.of("id", "Work zone does not exist")
            ));

        validateProjectAccess(workZone.getProject(), currentUser);

        workZone.setZoneName(request.zoneName().trim());
        workZone.setDescription(request.description());
        workZone.setLocality(request.locality().trim());
        workZone.setDistrict(request.district().trim());
        workZone.setState(request.state().trim());
        workZone.setCenterLatitude(request.centerLatitude());
        workZone.setCenterLongitude(request.centerLongitude());

        WorkZone updated = workZoneRepository.save(workZone);

        auditService.logEvent(
            currentUser,
            "WORK_ZONE_UPDATED",
            "WORK_ZONE",
            updated.getId(),
            "Updated work zone details for " + updated.getZoneCode(),
            null
        );

        return mapToResponse(updated);
    }

    @Transactional
    public WorkZoneResponse updateWorkZoneStatus(String id, UpdateZoneStatusRequest request, User currentUser) {
        WorkZone workZone = workZoneRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work zone not found with ID: " + id,
                Map.of("id", "Work zone does not exist")
            ));

        validateProjectAccess(workZone.getProject(), currentUser);

        // If deactivating, check if active assignments exist
        if (request.status() == ZoneStatus.INACTIVE) {
            long activeAssignments = workAssignmentRepository.countByWorkZoneIdAndStatusIn(
                id,
                List.of(AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.IN_PROGRESS, AssignmentStatus.SUBMITTED_FOR_REVIEW)
            );
            if (activeAssignments > 0) {
                throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Cannot deactivate work zone: " + activeAssignments + " active work assignment(s) are currently in progress.",
                    Map.of("status", "Active assignments exist in this zone")
                );
            }
        }

        ZoneStatus oldStatus = workZone.getStatus();
        workZone.setStatus(request.status());
        WorkZone updated = workZoneRepository.save(workZone);

        auditService.logEvent(
            currentUser,
            "WORK_ZONE_STATUS_CHANGED",
            "WORK_ZONE",
            updated.getId(),
            "Changed work zone " + updated.getZoneCode() + " status from " + oldStatus + " to " + request.status(),
            request.reason()
        );

        return mapToResponse(updated);
    }

    public WorkZone findEntityById(String id) {
        return workZoneRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "Work zone not found with ID: " + id,
                Map.of("workZoneId", "Work zone does not exist")
            ));
    }

    private void validateProjectAccess(Project project, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }
        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (project.getProjectManager() != null && project.getProjectManager().getId().equals(currentUser.getId())) {
                return;
            }
        }
        throw new ApiException(
            HttpStatus.FORBIDDEN,
            "Access denied: You do not have permission to manage work zones for this project.",
            Map.of("project", "Access restricted to assigned project managers and platform administrators")
        );
    }

    private void validateProjectReadAccess(Project project, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }
        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (project.getProjectManager() != null && project.getProjectManager().getId().equals(currentUser.getId())) {
                return;
            }
        } else if (currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vendorOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vendorOpt.isPresent()) {
                boolean associated = projectVendorRepository.existsByProjectIdAndVendorIdAndAssociationStatus(
                    project.getId(), vendorOpt.get().getId(), "ACTIVE"
                );
                if (associated) return;
            }
        } else if (currentUser.getRole() == UserRole.FIELD_ENGINEER || currentUser.getRole() == UserRole.FINANCE_OFFICER) {
            return;
        }

        throw new ApiException(
            HttpStatus.FORBIDDEN,
            "Access denied: You do not have permission to view this work zone.",
            Map.of("project", "Access denied")
        );
    }

    private String generateZoneCode(String pincode) {
        long count = workZoneRepository.count();
        String code;
        int counter = (int) count + 1;
        do {
            code = String.format("WZ-%s-%03d", pincode, counter++);
        } while (workZoneRepository.existsByZoneCode(code));
        return code;
    }

    private WorkZoneResponse mapToResponse(WorkZone zone) {
        long activeAssignments = workAssignmentRepository.countByWorkZoneIdAndStatusIn(
            zone.getId(),
            List.of(AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.IN_PROGRESS)
        );

        return new WorkZoneResponse(
            zone.getId(),
            zone.getZoneCode(),
            zone.getProject().getId(),
            zone.getProject().getProjectName(),
            zone.getZoneName(),
            zone.getDescription(),
            zone.getPincode(),
            zone.getLocality(),
            zone.getDistrict(),
            zone.getState(),
            zone.getCenterLatitude(),
            zone.getCenterLongitude(),
            zone.getStatus(),
            activeAssignments,
            zone.getCreatedAt(),
            zone.getUpdatedAt()
        );
    }
}
