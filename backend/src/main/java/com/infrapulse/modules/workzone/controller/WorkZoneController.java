package com.infrapulse.modules.workzone.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workzone.dto.CreateWorkZoneRequest;
import com.infrapulse.modules.workzone.dto.UpdateWorkZoneRequest;
import com.infrapulse.modules.workzone.dto.UpdateZoneStatusRequest;
import com.infrapulse.modules.workzone.dto.WorkZoneResponse;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import com.infrapulse.modules.workzone.service.WorkZoneService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/work-zones")
public class WorkZoneController {

    private final WorkZoneService workZoneService;

    public WorkZoneController(WorkZoneService workZoneService) {
        this.workZoneService = workZoneService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('WORK_ZONE_CREATE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkZoneResponse>> createWorkZone(
        @Valid @RequestBody CreateWorkZoneRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkZoneResponse response = workZoneService.createWorkZone(request, principal != null ? principal.getUser() : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Work zone created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('WORK_ZONE_VIEW', 'VIEW_WORK_ZONES')")
    public ResponseEntity<ApiResponse<Page<WorkZoneResponse>>> getWorkZones(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String pincode,
        @RequestParam(required = false) ZoneStatus status,
        @RequestParam(required = false) String locality,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<WorkZoneResponse> page = workZoneService.getWorkZones(projectId, pincode, status, locality, search, pageable, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('WORK_ZONE_VIEW', 'VIEW_WORK_ZONES')")
    public ResponseEntity<ApiResponse<WorkZoneResponse>> getWorkZoneById(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkZoneResponse response = workZoneService.getWorkZoneById(id, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('WORK_ZONE_UPDATE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkZoneResponse>> updateWorkZone(
        @PathVariable String id,
        @Valid @RequestBody UpdateWorkZoneRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkZoneResponse response = workZoneService.updateWorkZone(id, request, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Work zone updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('WORK_ZONE_STATUS_MANAGE', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<WorkZoneResponse>> updateWorkZoneStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateZoneStatusRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkZoneResponse response = workZoneService.updateWorkZoneStatus(id, request, principal != null ? principal.getUser() : null);
        return ResponseEntity.ok(ApiResponse.success("Work zone status updated successfully", response));
    }
}
