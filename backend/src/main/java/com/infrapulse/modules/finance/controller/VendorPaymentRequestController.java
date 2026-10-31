package com.infrapulse.modules.finance.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.CreatePaymentRequestDto;
import com.infrapulse.modules.finance.dto.SubmitClarificationRequest;
import com.infrapulse.modules.finance.dto.VendorPaymentRequestResponse;
import com.infrapulse.modules.finance.service.VendorPaymentRequestService;
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
@RequestMapping("/api/v1/payment-requests")
public class VendorPaymentRequestController {

    private final VendorPaymentRequestService paymentRequestService;

    public VendorPaymentRequestController(VendorPaymentRequestService paymentRequestService) {
        this.paymentRequestService = paymentRequestService;
    }

    @PostMapping("/milestone/{milestoneId}")
    @PreAuthorize("hasAuthority('SUBMIT_PAYMENT_REQUEST') or hasRole('VENDOR') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPaymentRequestResponse>> submitPaymentRequest(
            @PathVariable String milestoneId,
            @Valid @RequestBody CreatePaymentRequestDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorPaymentRequestResponse response = paymentRequestService.submitPaymentRequest(milestoneId, dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment request submitted successfully", response));
    }

    @GetMapping("/{requestId}")
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasAuthority('SUBMIT_PAYMENT_REQUEST') or hasRole('PLATFORM_ADMIN') or hasRole('FINANCE_OFFICER') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<VendorPaymentRequestResponse>> getPaymentRequestById(
            @PathVariable String requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorPaymentRequestResponse response = paymentRequestService.getPaymentRequestById(requestId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Payment request retrieved successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasRole('PLATFORM_ADMIN') or hasRole('FINANCE_OFFICER') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<Page<VendorPaymentRequestResponse>>> listPaymentRequests(
            @RequestParam(required = false) String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "submittedAt,desc") String sort) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<VendorPaymentRequestResponse> response = (projectId != null && !projectId.isBlank())
                ? paymentRequestService.getPaymentRequestsByProject(projectId, pageable)
                : paymentRequestService.getAllPaymentRequests(pageable);

        return ResponseEntity.ok(ApiResponse.success("Payment requests retrieved successfully", response));
    }

    @GetMapping("/vendor/me")
    @PreAuthorize("hasRole('VENDOR') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<VendorPaymentRequestResponse>>> getMyPaymentRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "submittedAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        User currentUser = principal != null ? principal.getUser() : null;
        Page<VendorPaymentRequestResponse> response = paymentRequestService.getVendorPaymentRequests(pageable, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Vendor payment requests retrieved successfully", response));
    }

    @PostMapping("/{requestId}/clarification")
    @PreAuthorize("hasAuthority('SUBMIT_PAYMENT_REQUEST') or hasRole('VENDOR') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPaymentRequestResponse>> submitClarification(
            @PathVariable String requestId,
            @Valid @RequestBody SubmitClarificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorPaymentRequestResponse response = paymentRequestService.submitClarification(requestId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Clarification submitted successfully", response));
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}
