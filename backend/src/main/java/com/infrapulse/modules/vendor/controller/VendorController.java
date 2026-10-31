package com.infrapulse.modules.vendor.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.vendor.dto.*;
import com.infrapulse.modules.vendor.enums.ServiceCategory;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import com.infrapulse.modules.vendor.service.VendorService;
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
@RequestMapping({"/api/v1/vendors", "/api/vendors"})
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('VENDOR_CREATE') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorResponse>> createVendor(
        @Valid @RequestBody CreateVendorRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        VendorResponse response = vendorService.createVendor(request, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Vendor created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VENDOR_VIEW') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> listVendors(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) VendorStatus status,
        @RequestParam(required = false) ServiceCategory category,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String district,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<VendorResponse> result = vendorService.listVendors(search, status, category, city, district, principal.getUser(), pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('VENDOR_VIEW') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorDetailResponse>> getVendorDetails(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        VendorDetailResponse response = vendorService.getVendorDetails(id, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('VENDOR_UPDATE') or hasRole('PLATFORM_ADMIN') or hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<VendorResponse>> updateVendor(
        @PathVariable String id,
        @Valid @RequestBody UpdateVendorRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        VendorResponse response = vendorService.updateVendor(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Vendor updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('VENDOR_STATUS_MANAGE') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorResponse>> updateVendorStatus(
        @PathVariable String id,
        @Valid @RequestBody UpdateVendorStatusRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        VendorResponse response = vendorService.updateVendorStatus(id, request, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Vendor status updated successfully", response));
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
