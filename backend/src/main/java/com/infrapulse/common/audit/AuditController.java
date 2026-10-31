package com.infrapulse.common.audit;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/v1")
public class AuditController {

    private final AuditService auditService;
    private final AuditEventRepository auditEventRepository;
    private final AuditIntegrityService integrityService;
    private final com.infrapulse.modules.vendor.repository.VendorRepository vendorRepository;

    public AuditController(
            AuditService auditService,
            AuditEventRepository auditEventRepository,
            AuditIntegrityService integrityService,
            com.infrapulse.modules.vendor.repository.VendorRepository vendorRepository
    ) {
        this.auditService = auditService;
        this.auditEventRepository = auditEventRepository;
        this.integrityService = integrityService;
        this.vendorRepository = vendorRepository;
    }

    private User extractUser(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.getUser();
    }

    @GetMapping("/audit-events")
    @PreAuthorize("hasAnyAuthority('VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditEvent>>> getAuditEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AuditCategory category,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String vendorId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuditOutcome outcome,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        
        // Scope restrictions for non-admin
        if (user.getRole() == UserRole.VENDOR) {
            vendorId = vendorRepository.findByUserId(user.getId())
                    .map(com.infrapulse.modules.vendor.entity.Vendor::getId)
                    .orElse(user.getId());
        }

        Instant startInstant = startDate != null ? startDate.atStartOfDay().toInstant(ZoneOffset.UTC) : null;
        Instant endInstant = endDate != null ? endDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC) : null;

        Page<AuditEvent> results = auditService.searchAuditEvents(
                search, category, eventType, actorId, projectId, vendorId, entityType, outcome, startInstant, endInstant, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/audit-events/{eventId}")
    @PreAuthorize("hasAnyAuthority('VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<AuditEvent>> getAuditEventById(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        AuditEvent event = auditEventRepository.findById(eventId)
                .or(() -> auditEventRepository.findByEventCode(eventId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit event not found: " + eventId));

        if (user.getRole() == UserRole.VENDOR) {
            String userVendorId = vendorRepository.findByUserId(user.getId())
                    .map(com.infrapulse.modules.vendor.entity.Vendor::getId)
                    .orElse(user.getId());
            if (event.getVendorId() != null && !event.getVendorId().equals(userVendorId)) {
                throw new AccessDeniedException("Unauthorized to view other vendor's audit record");
            }
        }

        return ResponseEntity.ok(ApiResponse.success(event));
    }

    @GetMapping("/audit-events/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAnyAuthority('VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<AuditEvent>>> getEntityAuditTrail(
            @PathVariable String entityType,
            @PathVariable String entityId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        extractUser(principal);
        java.util.List<AuditEvent> trail = auditService.getEntityAuditTrail(entityType.toUpperCase(), entityId);
        return ResponseEntity.ok(ApiResponse.success(trail));
    }

    @GetMapping("/audit-events/users/{userId}")
    @PreAuthorize("hasAnyAuthority('VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditEvent>>> getUserActivity(
            @PathVariable String userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        if (user.getRole() == UserRole.VENDOR && !user.getId().equals(userId)) {
            throw new AccessDeniedException("Vendors can only view their own user activity");
        }

        Page<AuditEvent> activity = auditService.getUserActivity(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @GetMapping("/projects/{projectId}/activity")
    @PreAuthorize("hasAnyAuthority('VIEW_PROJECTS', 'VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditEvent>>> getProjectActivity(
            @PathVariable String projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        extractUser(principal);
        Page<AuditEvent> activity = auditService.getProjectActivity(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @GetMapping("/vendors/{vendorId}/activity")
    @PreAuthorize("hasAnyAuthority('VENDOR_VIEW', 'VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditEvent>>> getVendorActivity(
            @PathVariable String vendorId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        // IDOR check for vendors
        if (user.getRole() == UserRole.VENDOR) {
            String userVendorId = vendorRepository.findByUserId(user.getId())
                    .map(com.infrapulse.modules.vendor.entity.Vendor::getId)
                    .orElse(user.getId());
            if (!userVendorId.equals(vendorId)) {
                throw new AccessDeniedException("Vendors cannot access other vendors' activity logs");
            }
        }

        Page<AuditEvent> activity = auditService.getVendorActivity(vendorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @GetMapping("/audit-events/integrity")
    @PreAuthorize("hasAnyAuthority('VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<AuditIntegrityReport>> getIntegrityStatus(
            @RequestParam(defaultValue = "GLOBAL") String chainScope,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        extractUser(principal);
        AuditIntegrityReport report = integrityService.verifyChain(chainScope);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/audit-events/integrity/{eventId}")
    @PreAuthorize("hasAnyAuthority('VIEW_AUDIT_TRAIL', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> verifySingleEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        extractUser(principal);
        AuditEvent event = auditEventRepository.findById(eventId)
                .or(() -> auditEventRepository.findByEventCode(eventId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: " + eventId));

        boolean valid = integrityService.verifySingleEvent(event);
        return ResponseEntity.ok(ApiResponse.success(valid));
    }

    @PostMapping("/audit-events/integrity/verify")
    @PreAuthorize("hasAnyAuthority('VERIFY_AUDIT_INTEGRITY', 'PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<AuditIntegrityReport>> verifyAuditChain(
            @RequestParam(defaultValue = "GLOBAL") String chainScope,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        User user = extractUser(principal);
        if (user.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new AccessDeniedException("Only platform administrators can trigger manual audit chain verification");
        }

        AuditIntegrityReport report = integrityService.verifyChain(chainScope);
        auditService.recordRichEvent(
                user, AuditCategory.SYSTEM, "AUDIT_CHAIN_VERIFIED", "VERIFY_INTEGRITY",
                "AUDIT_CHAIN", chainScope, chainScope, null, null,
                report.getStatus() == AuditIntegrityStatus.VALID ? AuditOutcome.SUCCESS : AuditOutcome.WARNING,
                "Audit chain integrity verified: status=" + report.getStatus() + ", checked=" + report.getTotalEventsChecked(),
                report.getViolations().isEmpty() ? "No violations found" : String.join("; ", report.getViolations()),
                null, "AUDIT_MODULE", null, null, null
        );

        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
