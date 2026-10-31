package com.infrapulse.modules.project.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.dto.AuditEventDto;
import com.infrapulse.common.dto.UserSummaryDto;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.project.dto.*;
import com.infrapulse.modules.vendor.dto.AssociateVendorRequest;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.entity.ProjectManagerAssignment;
import com.infrapulse.modules.project.entity.ProjectVendor;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.repository.ProjectManagerAssignmentRepository;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final ProjectManagerAssignmentRepository pmAssignmentRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ProjectService(
        ProjectRepository projectRepository,
        ProjectManagerAssignmentRepository pmAssignmentRepository,
        ProjectVendorRepository projectVendorRepository,
        VendorRepository vendorRepository,
        UserRepository userRepository,
        AuditService auditService
    ) {
        this.projectRepository = projectRepository;
        this.pmAssignmentRepository = pmAssignmentRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, User currentUser) {
        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform administrators can create projects");
        }

        if (request.getTargetEndDate().isBefore(request.getStartDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target completion date must not be before start date");
        }

        if (request.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Project budget must be greater than zero");
        }

        String projectCode = generateUniqueProjectCode(request.getRegion());

        User manager = null;
        if (request.getProjectManagerId() != null && !request.getProjectManagerId().isBlank()) {
            manager = validateAndGetProjectManager(request.getProjectManagerId());
        }

        Project project = new Project(
            null,
            projectCode,
            request.getProjectName().trim(),
            request.getDescription(),
            request.getProjectType(),
            request.getClientName().trim(),
            request.getRegion().trim(),
            request.getState().trim(),
            request.getDistrict().trim(),
            request.getPrimaryPincode().trim(),
            request.getStartDate(),
            request.getTargetEndDate(),
            request.getBudget(),
            ProjectStatus.PLANNED,
            manager,
            currentUser
        );

        Project saved = projectRepository.save(project);

        if (manager != null) {
            ProjectManagerAssignment assignment = new ProjectManagerAssignment(saved, manager, currentUser);
            pmAssignmentRepository.save(assignment);
        }

        log.info("Project created: code={}, name={}", saved.getProjectCode(), saved.getProjectName());

        auditService.recordEvent(
            currentUser.getId(),
            "PROJECT_CREATED",
            "PROJECT",
            saved.getId(),
            "Project " + saved.getProjectName() + " (" + saved.getProjectCode() + ") created in PLANNED status",
            null
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> listProjects(
        String search,
        ProjectStatus status,
        ProjectType projectType,
        String region,
        User currentUser,
        Pageable pageable
    ) {
        // Scoping for Project Manager: sees assigned projects
        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            Specification<Project> pmSpec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(cb.equal(root.get("projectManager").get("id"), currentUser.getId()));

                applyCommonFilters(root, cb, predicates, search, status, projectType, region);
                return cb.and(predicates.toArray(new Predicate[0]));
            };
            return projectRepository.findAll(pmSpec, pageable).map(this::mapToResponse);
        }

        // Scoping for Vendor: sees projects associated with their vendor record
        if (currentUser.getRole() == UserRole.VENDOR) {
            return projectRepository.findProjectsForVendorUserId(currentUser.getId(), pageable)
                .map(this::mapToResponse);
        }

        // Admin, Field Engineer, and Finance Officer:
        Specification<Project> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            applyCommonFilters(root, cb, predicates, search, status, projectType, region);
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return projectRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    private void applyCommonFilters(
        jakarta.persistence.criteria.Root<Project> root,
        jakarta.persistence.criteria.CriteriaBuilder cb,
        List<Predicate> predicates,
        String search,
        ProjectStatus status,
        ProjectType projectType,
        String region
    ) {
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            Predicate nameMatch = cb.like(cb.lower(root.get("projectName")), pattern);
            Predicate codeMatch = cb.like(cb.lower(root.get("projectCode")), pattern);
            Predicate clientMatch = cb.like(cb.lower(root.get("clientName")), pattern);
            Predicate districtMatch = cb.like(cb.lower(root.get("district")), pattern);
            predicates.add(cb.or(nameMatch, codeMatch, clientMatch, districtMatch));
        }

        if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
        }

        if (projectType != null) {
            predicates.add(cb.equal(root.get("projectType"), projectType));
        }

        if (region != null && !region.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("region")), region.trim().toLowerCase()));
        }
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectDetails(String id, User currentUser) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + id));

        validateProjectAccess(project, currentUser);

        List<ProjectVendor> associations = projectVendorRepository.findByProjectId(project.getId());
        List<ProjectVendorDto> vendorDtos = associations.stream()
            .map(this::mapToProjectVendorDto)
            .collect(Collectors.toList());

        List<ProjectManagerAssignment> assignments = pmAssignmentRepository.findByProjectIdOrderByAssignedAtDesc(project.getId());
        List<ProjectManagerAssignmentDto> assignmentDtos = assignments.stream()
            .map(this::mapToManagerAssignmentDto)
            .collect(Collectors.toList());

        List<AuditEventDto> auditDtos = auditService.getEntityAuditTrail("PROJECT", project.getId()).stream()
            .map(ae -> new AuditEventDto(
                ae.getId(),
                ae.getActorId(),
                ae.getEventType(),
                ae.getEntityType(),
                ae.getEntityId(),
                ae.getSummary(),
                ae.getReason(),
                ae.getCreatedAt()
            ))
            .collect(Collectors.toList());

        ProjectDetailResponse response = new ProjectDetailResponse();
        populateBaseResponse(project, response);
        response.setAssociatedVendors(vendorDtos);
        response.setManagerAssignments(assignmentDtos);
        response.setAuditTrail(auditDtos);

        return response;
    }

    @Transactional
    public ProjectResponse updateProject(String id, UpdateProjectRequest request, User currentUser) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == UserRole.PLATFORM_ADMIN;
        boolean isAssignedPm = currentUser.getRole() == UserRole.PROJECT_MANAGER &&
            project.getProjectManager() != null &&
            project.getProjectManager().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignedPm) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to update this project");
        }

        if (request.getTargetEndDate().isBefore(request.getStartDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target completion date must not be before start date");
        }

        if (request.getBudget().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Project budget must be greater than zero");
        }

        project.setProjectName(request.getProjectName().trim());
        project.setDescription(request.getDescription());
        project.setProjectType(request.getProjectType());
        project.setClientName(request.getClientName().trim());
        project.setRegion(request.getRegion().trim());
        project.setState(request.getState().trim());
        project.setDistrict(request.getDistrict().trim());
        project.setPrimaryPincode(request.getPrimaryPincode().trim());
        project.setStartDate(request.getStartDate());
        project.setTargetEndDate(request.getTargetEndDate());
        project.setBudget(request.getBudget());

        Project updated = projectRepository.save(project);
        log.info("Project updated: id={}, code={}", updated.getId(), updated.getProjectCode());

        auditService.recordEvent(
            currentUser.getId(),
            "PROJECT_UPDATED",
            "PROJECT",
            updated.getId(),
            "Project " + updated.getProjectName() + " updated by " + currentUser.getFullName(),
            null
        );

        return mapToResponse(updated);
    }

    @Transactional
    public ProjectResponse updateProjectStatus(String id, UpdateProjectStatusRequest request, User currentUser) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == UserRole.PLATFORM_ADMIN;
        boolean isAssignedPm = currentUser.getRole() == UserRole.PROJECT_MANAGER &&
            project.getProjectManager() != null &&
            project.getProjectManager().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignedPm) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to change this project's status");
        }

        ProjectStatus targetStatus = request.getStatus();
        if (!project.getStatus().canTransitionTo(targetStatus)) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Invalid status transition from " + project.getStatus() + " to " + targetStatus
            );
        }

        ProjectStatus oldStatus = project.getStatus();
        project.setStatus(targetStatus);
        Project saved = projectRepository.save(project);

        String reason = request.getReason() != null ? request.getReason().trim() : "No reason provided";
        auditService.recordEvent(
            currentUser.getId(),
            "PROJECT_STATUS_CHANGED",
            "PROJECT",
            saved.getId(),
            "Project status transitioned from " + oldStatus + " to " + targetStatus + ". Reason: " + reason,
            reason
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ProjectResponse assignProjectManager(String id, AssignProjectManagerRequest request, User currentUser) {
        if (currentUser.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform administrators can assign project managers");
        }

        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + id));

        User newManager = validateAndGetProjectManager(request.getManagerId());

        // Deactivate previous active assignments in assignment history
        pmAssignmentRepository.findFirstByProjectIdAndActiveTrue(project.getId())
            .ifPresent(prev -> {
                prev.setActive(false);
                pmAssignmentRepository.save(prev);
            });

        // Create new active assignment
        ProjectManagerAssignment newAssignment = new ProjectManagerAssignment(project, newManager, currentUser);
        pmAssignmentRepository.save(newAssignment);

        project.setProjectManager(newManager);
        Project saved = projectRepository.save(project);

        log.info("Project manager assigned: project={}, manager={}", saved.getProjectCode(), newManager.getEmail());

        auditService.recordEvent(
            currentUser.getId(),
            "PROJECT_MANAGER_ASSIGNED",
            "PROJECT",
            saved.getId(),
            "Assigned " + newManager.getFullName() + " as Project Manager for project " + saved.getProjectName(),
            null
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ProjectVendorDto associateVendor(String projectId, AssociateVendorRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + projectId));

        boolean isAdmin = currentUser.getRole() == UserRole.PLATFORM_ADMIN;
        boolean isAssignedPm = currentUser.getRole() == UserRole.PROJECT_MANAGER &&
            project.getProjectManager() != null &&
            project.getProjectManager().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignedPm) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform admins or assigned project managers can associate vendors");
        }

        Vendor vendor = vendorRepository.findById(request.getVendorId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found with id: " + request.getVendorId()));

        if (vendor.getStatus() != VendorStatus.ACTIVE) {
            throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Vendor cannot be associated because status is " + vendor.getStatus() + ". Only ACTIVE vendors can be associated."
            );
        }

        if (projectVendorRepository.hasActiveAssociation(projectId, vendor.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Vendor is already actively associated with this project");
        }

        ProjectVendor association = new ProjectVendor(project, vendor, currentUser, request.getNotes());
        ProjectVendor saved = projectVendorRepository.save(association);

        log.info("Vendor associated with project: vendor={}, project={}", vendor.getVendorCode(), project.getProjectCode());

        auditService.recordEvent(
            currentUser.getId(),
            "VENDOR_ASSOCIATED",
            "PROJECT",
            project.getId(),
            "Associated vendor " + vendor.getCompanyName() + " (" + vendor.getVendorCode() + ") with project " + project.getProjectName(),
            request.getNotes()
        );

        return mapToProjectVendorDto(saved);
    }

    @Transactional
    public void removeVendorAssociation(String projectId, String vendorId, User currentUser) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + projectId));

        boolean isAdmin = currentUser.getRole() == UserRole.PLATFORM_ADMIN;
        boolean isAssignedPm = currentUser.getRole() == UserRole.PROJECT_MANAGER &&
            project.getProjectManager() != null &&
            project.getProjectManager().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignedPm) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform admins or assigned project managers can remove vendor associations");
        }

        ProjectVendor association = projectVendorRepository.findByProjectIdAndVendorIdAndAssociationStatus(projectId, vendorId, "ACTIVE")
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Active association not found between project and vendor"));

        association.setAssociationStatus("DEACTIVATED");
        association.setDeactivatedAt(Instant.now());
        projectVendorRepository.save(association);

        log.info("Vendor association deactivated: project={}, vendor={}", projectId, vendorId);

        auditService.recordEvent(
            currentUser.getId(),
            "VENDOR_ASSOCIATION_DEACTIVATED",
            "PROJECT",
            project.getId(),
            "Deactivated vendor association for " + association.getVendor().getCompanyName() + " on project " + project.getProjectName(),
            null
        );
    }

    private User validateAndGetProjectManager(String managerId) {
        User user = userRepository.findById(managerId)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Project manager user not found with id: " + managerId));

        if (user.getRole() != UserRole.PROJECT_MANAGER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user must have the PROJECT_MANAGER role");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot assign inactive user as project manager");
        }

        return user;
    }

    private void validateProjectAccess(Project project, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN ||
            currentUser.getRole() == UserRole.FIELD_ENGINEER ||
            currentUser.getRole() == UserRole.FINANCE_OFFICER) {
            return;
        }

        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (project.getProjectManager() == null || !project.getProjectManager().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: you can only view projects assigned to you");
            }
            return;
        }

        if (currentUser.getRole() == UserRole.VENDOR) {
            boolean isAssociated = projectRepository.isVendorAssociatedWithProject(project.getId(), currentUser.getId());
            if (!isAssociated) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied: your company is not associated with this project");
            }
            return;
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to project");
    }

    private String generateUniqueProjectCode(String region) {
        String regionPrefix = "PRJ";
        if (region != null && !region.isBlank()) {
            String sanitized = region.replaceAll("[^a-zA-Z]", "").toUpperCase();
            if (sanitized.length() >= 3) {
                regionPrefix = "PRJ-" + sanitized.substring(0, 3);
            }
        }
        String code;
        int attempts = 0;
        do {
            int randomNum = 100 + new Random().nextInt(900);
            code = regionPrefix + "-" + randomNum;
            attempts++;
            if (attempts > 50) {
                code = "PRJ-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            }
        } while (projectRepository.existsByProjectCode(code));
        return code;
    }

    public ProjectResponse mapToResponse(Project project) {
        ProjectResponse response = new ProjectResponse();
        populateBaseResponse(project, response);
        return response;
    }

    private void populateBaseResponse(Project project, ProjectResponse response) {
        response.setId(project.getId());
        response.setProjectCode(project.getProjectCode());
        response.setProjectName(project.getProjectName());
        response.setDescription(project.getDescription());
        response.setProjectType(project.getProjectType());
        response.setClientName(project.getClientName());
        response.setRegion(project.getRegion());
        response.setState(project.getState());
        response.setDistrict(project.getDistrict());
        response.setPrimaryPincode(project.getPrimaryPincode());
        response.setStartDate(project.getStartDate());
        response.setTargetEndDate(project.getTargetEndDate());
        response.setActualEndDate(project.getActualEndDate());
        response.setBudget(project.getBudget());
        response.setStatus(project.getStatus());
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt());

        if (project.getProjectManager() != null) {
            User pm = project.getProjectManager();
            response.setProjectManager(new UserSummaryDto(pm.getId(), pm.getFullName(), pm.getEmail(), pm.getRole().name()));
        }

        if (project.getCreatedBy() != null) {
            User creator = project.getCreatedBy();
            response.setCreatedBy(new UserSummaryDto(creator.getId(), creator.getFullName(), creator.getEmail(), creator.getRole().name()));
        }

        long count = projectVendorRepository.findByProjectIdAndAssociationStatus(project.getId(), "ACTIVE").size();
        response.setAssociatedVendorsCount((int) count);
        response.setProgressPercentage(0.0);
    }

    private ProjectVendorDto mapToProjectVendorDto(ProjectVendor pv) {
        Vendor v = pv.getVendor();
        ProjectVendorDto dto = new ProjectVendorDto();
        dto.setId(pv.getId());
        dto.setVendorId(v.getId());
        dto.setVendorCode(v.getVendorCode());
        dto.setCompanyName(v.getCompanyName());
        dto.setContactPerson(v.getContactPerson());
        dto.setEmail(v.getEmail());
        dto.setPhoneNumber(v.getPhoneNumber());
        dto.setCity(v.getCity());
        dto.setState(v.getState());
        dto.setStatus(v.getStatus());
        dto.setServiceCategories(v.getServiceCategories());
        dto.setAssociationStatus(pv.getAssociationStatus());
        dto.setAssociatedAt(pv.getAssociatedAt());
        dto.setDeactivatedAt(pv.getDeactivatedAt());
        if (pv.getAssociatedBy() != null) {
            dto.setAssociatedByName(pv.getAssociatedBy().getFullName());
        }
        dto.setNotes(pv.getNotes());
        return dto;
    }

    private ProjectManagerAssignmentDto mapToManagerAssignmentDto(ProjectManagerAssignment a) {
        return new ProjectManagerAssignmentDto(
            a.getId(),
            a.getManager().getId(),
            a.getManager().getFullName(),
            a.getManager().getEmail(),
            a.getAssignedAt(),
            a.getAssignedBy().getFullName(),
            a.isActive()
        );
    }
}
