package com.infrapulse.modules.finance.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.PaymentAuthorizationResponse;
import com.infrapulse.modules.finance.service.PaymentAuthorizationService;
import com.infrapulse.security.UserPrincipal;
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
@RequestMapping("/api/v1/payments")
public class PaymentAuthorizationController {

    private final PaymentAuthorizationService paymentAuthorizationService;

    public PaymentAuthorizationController(PaymentAuthorizationService paymentAuthorizationService) {
        this.paymentAuthorizationService = paymentAuthorizationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUTHORIZE_PAYMENTS') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<Page<PaymentAuthorizationResponse>>> listPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "authorizedAt,desc") String sort) {
        Sort sortObj = parseSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<PaymentAuthorizationResponse> response = paymentAuthorizationService.getAllPayments(pageable);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", response));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAuthority('AUTHORIZE_PAYMENTS') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<PaymentAuthorizationResponse>> getPaymentById(
            @PathVariable String paymentId) {
        PaymentAuthorizationResponse response = paymentAuthorizationService.getPaymentById(paymentId);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    @PostMapping("/{paymentId}/simulate-settlement")
    @PreAuthorize("hasAuthority('AUTHORIZE_PAYMENTS') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<ApiResponse<PaymentAuthorizationResponse>> simulateSettlement(
            @PathVariable String paymentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        User currentUser = principal != null ? principal.getUser() : null;
        PaymentAuthorizationResponse response = paymentAuthorizationService.simulateSettlement(paymentId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Simulated settlement completed successfully", response));
    }

    @GetMapping("/milestone/{milestoneId}")
    @PreAuthorize("hasAuthority('VIEW_MILESTONES') or hasRole('FINANCE_OFFICER') or hasRole('PLATFORM_ADMIN') or hasRole('PROJECT_MANAGER') or hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<List<PaymentAuthorizationResponse>>> getPaymentsByMilestone(
            @PathVariable String milestoneId) {
        List<PaymentAuthorizationResponse> response = paymentAuthorizationService.getPaymentsByMilestone(milestoneId);
        return ResponseEntity.ok(ApiResponse.success("Milestone payment history retrieved successfully", response));
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, property);
    }
}
