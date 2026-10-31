package com.infrapulse.modules.finance.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.service.FinanceApprovalService;
import com.infrapulse.modules.finance.service.FinanceDashboardService;
import com.infrapulse.modules.finance.service.PaymentAuthorizationService;
import com.infrapulse.modules.finance.service.VendorPaymentRequestService;
import com.infrapulse.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance")
public class FinanceReviewController {

    private final FinanceApprovalService financeApprovalService;
    private final VendorPaymentRequestService paymentRequestService;
    private final PaymentAuthorizationService paymentAuthorizationService;
    private final FinanceDashboardService dashboardService;

    public FinanceReviewController(
            FinanceApprovalService financeApprovalService,
            VendorPaymentRequestService paymentRequestService,
            PaymentAuthorizationService paymentAuthorizationService,
            FinanceDashboardService dashboardService) {
        this.financeApprovalService = financeApprovalService;
        this.paymentRequestService = paymentRequestService;
        this.paymentAuthorizationService = paymentAuthorizationService;
        this.dashboardService = dashboardService;
    }

    @GetMapping("/review-queue")
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<Page<VendorPaymentRequestResponse>>> getReviewQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "submittedAt,desc") String sort) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<VendorPaymentRequestResponse> response = financeApprovalService.getFinanceReviewQueue(pageable);
        return ResponseEntity.ok(ApiResponse.success("Finance review queue retrieved successfully", response));
    }

    @GetMapping("/payment-requests/{requestId}")
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPaymentRequestResponse>> getPaymentRequestDetail(
            @PathVariable String requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorPaymentRequestResponse response = paymentRequestService.getPaymentRequestById(requestId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Payment request detail retrieved successfully", response));
    }

    @PostMapping("/payment-requests/{requestId}/verify-invoice")
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPaymentRequestResponse>> verifyInvoice(
            @PathVariable String requestId,
            @Valid @RequestBody VerifyInvoiceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorPaymentRequestResponse response = financeApprovalService.verifyInvoice(requestId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Invoice verification recorded successfully", response));
    }

    @PostMapping("/payment-requests/{requestId}/decisions")
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<VendorPaymentRequestResponse>> recordDecision(
            @PathVariable String requestId,
            @Valid @RequestBody FinancialDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        VendorPaymentRequestResponse response = financeApprovalService.recordDecision(requestId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Financial approval decision recorded successfully", response));
    }

    @GetMapping("/payment-requests/{requestId}/decision-history")
    @PreAuthorize("hasAuthority('REVIEW_PAYMENT_REQUEST') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<List<FinancialApprovalDecisionResponse>>> getDecisionHistory(
            @PathVariable String requestId) {
        List<FinancialApprovalDecisionResponse> response = financeApprovalService.getDecisionHistory(requestId);
        return ResponseEntity.ok(ApiResponse.success("Decision history retrieved successfully", response));
    }

    @PostMapping("/payment-requests/{requestId}/authorize")
    @PreAuthorize("hasAuthority('AUTHORIZE_PAYMENTS') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<PaymentAuthorizationResponse>> authorizePayment(
            @PathVariable String requestId,
            @Valid @RequestBody AuthorizePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        PaymentAuthorizationResponse response = paymentAuthorizationService.authorizePayment(requestId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Simulated payment authorization issued successfully", response));
    }

    @GetMapping("/dashboard/summary")
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<FinanceDashboardSummaryResponse>> getDashboardSummary() {
        FinanceDashboardSummaryResponse response = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success("Finance dashboard summary retrieved successfully", response));
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}
