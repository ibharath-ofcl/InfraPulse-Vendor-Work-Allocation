package com.infrapulse.modules.project.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.project.dto.*;
import com.infrapulse.modules.vendor.dto.AssociateVendorRequest;
import com.infrapulse.modules.project.enums.ProjectStatus;
import com.infrapulse.modules.project.enums.ProjectType;
import com.infrapulse.modules.project.service.ProjectService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/projects", "/api/projects"})
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_CREATE') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
        @Valid @RequestBody CreateProjectRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectResponse response = projectService.createProject(request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Project created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_PROJECTS') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> listProjects(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) ProjectStatus status,
        @RequestParam(required = false) ProjectType projectType,
        @RequestParam(required = false) String region,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<ProjectResponse> result = projectService.listProjects(search, status, projectType, region, principal.getUser(), pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('VIEW_PROJECTS') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> getProjectDetails(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectDetailResponse response = projectService.getProjectDetails(id, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PROJECT_UPDATE') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
        @PathVariable String id,
        @Valid @RequestBody UpdateProjectRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectResponse response = projectService.updateProject(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PROJECT_STATUS_MANAGE') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProjectStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateProjectStatusRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectResponse response = projectService.updateProjectStatus(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Project status updated successfully", response));
    }

    @PutMapping("/{id}/manager")
    @PreAuthorize("hasAuthority('PROJECT_MANAGER_ASSIGN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectResponse>> assignProjectManager(
        @PathVariable String id,
        @Valid @RequestBody AssignProjectManagerRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectResponse response = projectService.assignProjectManager(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Project manager assigned successfully", response));
    }

    @PostMapping("/{projectId}/vendors")
    @PreAuthorize("hasAuthority('PROJECT_VENDOR_ASSOCIATE') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectVendorDto>> associateVendor(
        @PathVariable String projectId,
        @Valid @RequestBody AssociateVendorRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProjectVendorDto response = projectService.associateVendor(projectId, request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Vendor associated with project successfully", response));
    }

    @DeleteMapping("/{projectId}/vendors/{vendorId}")
    @PreAuthorize("hasAuthority('PROJECT_VENDOR_ASSOCIATE') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> removeVendorAssociation(
        @PathVariable String projectId,
        @PathVariable String vendorId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        projectService.removeVendorAssociation(projectId, vendorId, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Vendor association deactivated successfully", null));
    }

    private Sort parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sortParam.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}
