package com.infrapulse.modules.workertrust.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.workertrust.dto.*;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.service.*;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/workertrust", "/api/workertrust"})
public class WorkerTrustController {

    private final WorkerService workerService;
    private final WorkerAssignmentService assignmentService;
    private final WorkerSiteAccessService siteAccessService;
    private final WorkerIncidentService incidentService;
    private final WorkerAnalyticsService analyticsService;

    public WorkerTrustController(
        WorkerService workerService,
        WorkerAssignmentService assignmentService,
        WorkerSiteAccessService siteAccessService,
        WorkerIncidentService incidentService,
        WorkerAnalyticsService analyticsService
    ) {
        this.workerService = workerService;
        this.assignmentService = assignmentService;
        this.siteAccessService = siteAccessService;
        this.incidentService = incidentService;
        this.analyticsService = analyticsService;
    }

    // --- Worker Lifecycle & Directory ---

    @PostMapping("/workers")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR') or hasAuthority('WORKER_REGISTER')")
    public ResponseEntity<ApiResponse<WorkerSummaryResponse>> registerWorker(
        @Valid @RequestBody RegisterWorkerRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerSummaryResponse response = workerService.registerWorker(request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Worker registered successfully with unique ID", response));
    }

    @GetMapping("/workers")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('WORKER_VIEW')")
    public ResponseEntity<ApiResponse<Page<WorkerSummaryResponse>>> listWorkers(
        @RequestParam(required = false) WorkerStatus status,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String vendorId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "15") int size,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<WorkerSummaryResponse> response = workerService.listWorkers(status, search, vendorId, page, size, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Workers retrieved successfully", response));
    }

    @GetMapping("/workers/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('WORKER_VIEW')")
    public ResponseEntity<ApiResponse<WorkerDetailResponse>> getWorkerDetail(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerDetailResponse response = workerService.getWorkerDetail(id, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Worker details retrieved successfully", response));
    }

    // --- Documents & Verifications ---

    @PostMapping("/workers/{id}/documents")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR') or hasAuthority('WORKER_REGISTER')")
    public ResponseEntity<ApiResponse<WorkerDocumentDto>> uploadDocument(
        @PathVariable String id,
        @RequestParam DocumentType documentType,
        @RequestParam String originalFilename,
        @RequestParam String contentType,
        @RequestParam Long fileSize,
        @RequestParam(required = false) String secureStorageReference,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerDocumentDto response = workerService.uploadDocument(
            id, documentType, originalFilename, contentType, fileSize, secureStorageReference, principal.getUser()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Document uploaded successfully to secure vault", response));
    }

    @PatchMapping("/documents/{documentId}/review")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_VERIFY')")
    public ResponseEntity<ApiResponse<WorkerDocumentDto>> reviewDocument(
        @PathVariable String documentId,
        @Valid @RequestBody ReviewDocumentRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerDocumentDto response = workerService.reviewDocument(documentId, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Document review updated successfully", response));
    }

    @PatchMapping("/verifications/{verificationId}/review")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_VERIFY')")
    public ResponseEntity<ApiResponse<WorkerVerificationDto>> reviewVerification(
        @PathVariable String verificationId,
        @Valid @RequestBody UpdateVerificationRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerVerificationDto response = workerService.reviewVerification(verificationId, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Verification status updated successfully", response));
    }

    // --- Certifications ---

    @PostMapping("/workers/{id}/certifications")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR') or hasAuthority('WORKER_REGISTER')")
    public ResponseEntity<ApiResponse<WorkerCertificationDto>> addCertification(
        @PathVariable String id,
        @Valid @RequestBody AddCertificationRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerCertificationDto response = workerService.addCertification(id, request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Certification added successfully", response));
    }

    @PatchMapping("/certifications/{certId}/verify")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_VERIFY')")
    public ResponseEntity<ApiResponse<WorkerCertificationDto>> verifyCertification(
        @PathVariable String certId,
        @RequestParam CertificationStatus status,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerCertificationDto response = workerService.verifyCertification(certId, status, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Certification verification updated", response));
    }

    // --- Approval & Lifecycle Management ---

    @PostMapping("/workers/{id}/approval")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_APPROVE')")
    public ResponseEntity<ApiResponse<WorkerDetailResponse>> approveWorker(
        @PathVariable String id,
        @Valid @RequestBody WorkerApprovalRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerDetailResponse response = workerService.approveOrRejectWorker(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Worker approval decision recorded successfully", response));
    }

    @PostMapping("/workers/{id}/suspend")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_SAFETY')")
    public ResponseEntity<ApiResponse<WorkerDetailResponse>> suspendWorker(
        @PathVariable String id,
        @Valid @RequestBody SuspendWorkerRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerDetailResponse response = workerService.suspendWorker(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Worker access suspended successfully", response));
    }

    @PostMapping("/workers/{id}/reactivate")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_SAFETY')")
    public ResponseEntity<ApiResponse<WorkerDetailResponse>> reactivateWorker(
        @PathVariable String id,
        @Valid @RequestBody ReactivateWorkerRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerDetailResponse response = workerService.reactivateWorker(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Worker reactivated and cleared for assignment", response));
    }

    // --- QR Credential & Badges ---

    @GetMapping("/workers/{id}/qr-badge")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER') or hasAuthority('WORKER_VIEW')")
    public ResponseEntity<ApiResponse<WorkerQrBadgeResponse>> getWorkerQrBadge(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerQrBadgeResponse response = siteAccessService.generateOrGetQrBadge(id, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Worker QR badge retrieved successfully", response));
    }

    // --- Project & Work Zone Allocation ---

    @PostMapping("/workers/{id}/assignments")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_ASSIGN')")
    public ResponseEntity<ApiResponse<WorkerAssignmentDto>> assignWorker(
        @PathVariable String id,
        @Valid @RequestBody AssignWorkerRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerAssignmentDto response = assignmentService.assignWorker(id, request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Worker assigned to project work zone successfully", response));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_ASSIGN')")
    public ResponseEntity<ApiResponse<WorkerAssignmentDto>> cancelAssignment(
        @PathVariable String assignmentId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerAssignmentDto response = assignmentService.cancelAssignment(assignmentId, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Worker assignment cancelled successfully", response));
    }

    // --- Site Entry, Exit & Attendance Operations ---

    @PostMapping("/site-access/check-in")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER') or hasAuthority('WORKER_SITE_ACCESS')")
    public ResponseEntity<ApiResponse<SiteAccessScanResult>> checkIn(
        @Valid @RequestBody SiteCheckInRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        SiteAccessScanResult result = siteAccessService.checkIn(request, principal.getUser());
        String msg = result.allowed() ? "Site entry ALLOWED" : "Site entry BLOCKED: " + result.blockingReason();
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }

    @PostMapping("/site-access/check-out")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER') or hasAuthority('WORKER_SITE_ACCESS')")
    public ResponseEntity<ApiResponse<SiteAccessScanResult>> checkOut(
        @Valid @RequestBody SiteCheckOutRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        SiteAccessScanResult result = siteAccessService.checkOut(request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Site check-out recorded successfully", result));
    }

    @GetMapping("/site-access/emergency-headcount")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER') or hasAuthority('WORKER_HEADCOUNT')")
    public ResponseEntity<ApiResponse<EmergencyHeadcountResponse>> getEmergencyHeadcount(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String workZoneId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        EmergencyHeadcountResponse response = siteAccessService.getEmergencyHeadcount(projectId, workZoneId, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Emergency workforce headcount generated", response));
    }

    @GetMapping("/site-access/attendance")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('WORKER_VIEW')")
    public ResponseEntity<ApiResponse<Page<WorkerSiteAccessDto>>> getAttendanceHistory(
        @RequestParam(required = false) String vendorId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<WorkerSiteAccessDto> response = siteAccessService.getAttendanceHistory(vendorId, page, size, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Attendance history retrieved successfully", response));
    }

    // --- Safety & Incident Management ---

    @PostMapping("/incidents")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER', 'VENDOR') or hasAuthority('WORKER_SAFETY')")
    public ResponseEntity<ApiResponse<WorkerIncidentDto>> reportIncident(
        @Valid @RequestBody ReportIncidentRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerIncidentDto response = incidentService.reportIncident(request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Safety incident reported successfully", response));
    }

    @GetMapping("/incidents")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER', 'VENDOR') or hasAuthority('WORKER_SAFETY')")
    public ResponseEntity<ApiResponse<Page<WorkerIncidentDto>>> listIncidents(
        @RequestParam(required = false) IncidentStatus status,
        @RequestParam(required = false) IncidentSeverity severity,
        @RequestParam(required = false) String projectId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "15") int size
    ) {
        Page<WorkerIncidentDto> response = incidentService.listIncidents(status, severity, projectId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Incidents retrieved successfully", response));
    }

    @PatchMapping("/incidents/{id}/resolve")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('WORKER_SAFETY')")
    public ResponseEntity<ApiResponse<WorkerIncidentDto>> resolveIncident(
        @PathVariable String id,
        @Valid @RequestBody ResolveIncidentRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkerIncidentDto response = incidentService.resolveIncident(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Incident resolved and closed", response));
    }

    // --- Workforce Analytics ---

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FINANCE_OFFICER', 'VENDOR', 'FIELD_ENGINEER') or hasAuthority('WORKER_ANALYTICS')")
    public ResponseEntity<ApiResponse<WorkforceAnalyticsResponse>> getAnalytics(
        @RequestParam(required = false) String projectId,
        @RequestParam(required = false) String vendorId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        WorkforceAnalyticsResponse response = analyticsService.getAnalytics(projectId, vendorId, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Workforce analytics retrieved successfully", response));
    }
}

