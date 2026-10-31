package com.infrapulse.modules.analytics.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.analytics.dto.ExportReportRequestDto;
import com.infrapulse.modules.analytics.dto.ReportJobResponseDto;
import com.infrapulse.modules.analytics.service.ReportExportService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportExportController {

    private final ReportExportService reportExportService;

    public ReportExportController(ReportExportService reportExportService) {
        this.reportExportService = reportExportService;
    }

    private User extractUser(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.getUser();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('EXPORT_REPORTS', 'VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<ReportJobResponseDto>>> getReportJobs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        Page<ReportJobResponseDto> page = reportExportService.getReportJobs(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping("/export")
    @PreAuthorize("hasAnyAuthority('EXPORT_REPORTS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ReportJobResponseDto>> exportReport(
            @Valid @RequestBody ExportReportRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        ReportJobResponseDto job = reportExportService.exportReport(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(job));
    }

    @GetMapping("/{reportId}")
    @PreAuthorize("hasAnyAuthority('EXPORT_REPORTS', 'VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<ReportJobResponseDto>> getReportJob(
            @PathVariable String reportId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        ReportJobResponseDto job = reportExportService.getReportJob(reportId, user);
        return ResponseEntity.ok(ApiResponse.success(job));
    }

    @GetMapping("/{reportId}/download")
    @PreAuthorize("hasAnyAuthority('EXPORT_REPORTS', 'VIEW_ANALYTICS', 'PLATFORM_ADMIN')")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable String reportId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        byte[] csvBytes = reportExportService.downloadReportContent(reportId, user);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report_" + reportId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }
}
