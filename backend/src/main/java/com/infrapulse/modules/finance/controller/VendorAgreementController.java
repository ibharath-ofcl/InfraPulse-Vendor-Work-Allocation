package com.infrapulse.modules.finance.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.service.VendorAgreementService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendor-agreements")
public class VendorAgreementController {

    private final VendorAgreementService agreementService;

    public VendorAgreementController(VendorAgreementService agreementService) {
        this.agreementService = agreementService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_AGREEMENTS') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<VendorAgreementResponse>> createAgreement(
            @Valid @RequestBody CreateAgreementRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorAgreementResponse response = agreementService.createAgreement(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Commercial agreement created successfully", response));
    }

    @PutMapping("/{agreementId}")
    @PreAuthorize("hasAuthority('MANAGE_AGREEMENTS') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<VendorAgreementResponse>> updateAgreement(
            @PathVariable String agreementId,
            @Valid @RequestBody UpdateAgreementRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorAgreementResponse response = agreementService.updateAgreement(agreementId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Commercial agreement updated successfully", response));
    }

    @GetMapping("/{agreementId}")
    @PreAuthorize("hasAuthority('VIEW_AGREEMENTS') or hasRole('PLATFORM_ADMIN') or hasRole('FINANCE_OFFICER') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<VendorAgreementResponse>> getAgreementById(
            @PathVariable String agreementId) {
        VendorAgreementResponse response = agreementService.getAgreementById(agreementId);
        return ResponseEntity.ok(ApiResponse.success("Agreement retrieved successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_AGREEMENTS') or hasRole('PLATFORM_ADMIN') or hasRole('FINANCE_OFFICER') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<Page<VendorAgreementResponse>>> getAgreements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<VendorAgreementResponse> response = agreementService.getAgreements(pageable);
        return ResponseEntity.ok(ApiResponse.success("Agreements retrieved successfully", response));
    }

    @GetMapping("/{agreementId}/versions")
    @PreAuthorize("hasAuthority('VIEW_AGREEMENTS') or hasRole('PLATFORM_ADMIN') or hasRole('FINANCE_OFFICER') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<List<VendorAgreementVersionResponse>>> getAgreementVersions(
            @PathVariable String agreementId) {
        List<VendorAgreementVersionResponse> response = agreementService.getAgreementVersions(agreementId);
        return ResponseEntity.ok(ApiResponse.success("Agreement version history retrieved successfully", response));
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}
