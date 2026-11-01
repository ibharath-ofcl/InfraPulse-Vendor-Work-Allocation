package com.infrapulse.modules.intelligence.contract.controller;

import com.infrapulse.common.ApiResponse;
import com.infrapulse.security.UserPrincipal;
import com.infrapulse.modules.intelligence.contract.dto.*;
import com.infrapulse.modules.intelligence.contract.model.ContractStatus;
import com.infrapulse.modules.intelligence.contract.model.RequirementApprovalStatus;
import com.infrapulse.modules.intelligence.contract.model.RequirementCategory;
import com.infrapulse.modules.intelligence.contract.service.ContractIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/intelligence")
public class ContractIntelligenceController {

    private final ContractIntelligenceService contractService;

    public ContractIntelligenceController(ContractIntelligenceService contractService) {
        this.contractService = contractService;
    }

    @PostMapping("/contracts")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('CONTRACT_MANAGE')")
    public ResponseEntity<ApiResponse<ContractResponse>> createContract(
            @Valid @RequestBody CreateContractRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractResponse res = contractService.createContract(req, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Contract registered successfully", res));
    }

    @GetMapping("/contracts/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('CONTRACT_VIEW')")
    public ResponseEntity<ApiResponse<ContractResponse>> getContract(@PathVariable String id) {
        ContractResponse res = contractService.getContract(id);
        return ResponseEntity.ok(ApiResponse.success("Contract details retrieved", res));
    }

    @GetMapping("/contracts")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('CONTRACT_VIEW')")
    public ResponseEntity<ApiResponse<Page<ContractResponse>>> listContracts(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) ContractStatus status,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        Page<ContractResponse> res = contractService.listContracts(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Contracts listed", res));
    }

    @PostMapping("/contracts/{id}/documents")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('CONTRACT_MANAGE')")
    public ResponseEntity<ApiResponse<ContractResponse>> uploadContractDocument(
            @PathVariable String id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "textSpecification", required = false) String textSpecification,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractResponse res = contractService.uploadAndExtractDocument(id, file, textSpecification, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Document analyzed and draft requirements extracted successfully", res));
    }

    @PostMapping("/contracts/{id}/requirements")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('CONTRACT_MANAGE')")
    public ResponseEntity<ApiResponse<ContractRequirementDto>> addRequirement(
            @PathVariable String id,
            @Valid @RequestBody CreateRequirementRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractRequirementDto res = contractService.addRequirement(id, req, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Contract requirement created", res));
    }

    @GetMapping("/contracts/{id}/requirements")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('CONTRACT_VIEW')")
    public ResponseEntity<ApiResponse<List<ContractRequirementDto>>> getContractRequirements(@PathVariable String id) {
        List<ContractRequirementDto> res = contractService.getContractRequirements(id);
        return ResponseEntity.ok(ApiResponse.success("Contract requirements retrieved", res));
    }

    @GetMapping("/projects/{projectId}/requirements")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('CONTRACT_VIEW')")
    public ResponseEntity<ApiResponse<Page<ContractRequirementDto>>> getProjectRequirements(
            @PathVariable String projectId,
            @RequestParam(required = false) RequirementCategory category,
            @RequestParam(required = false) RequirementApprovalStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ContractRequirementDto> res = contractService.getProjectRequirements(projectId, category, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Project requirements retrieved", res));
    }

    @PatchMapping("/requirements/{id}/approve")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('CONTRACT_MANAGE')")
    public ResponseEntity<ApiResponse<ContractRequirementDto>> approveRequirement(
            @PathVariable String id,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractRequirementDto res = contractService.approveRequirement(id, notes, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Requirement approved for active project verification", res));
    }

    @PatchMapping("/requirements/{id}/reject")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('CONTRACT_MANAGE')")
    public ResponseEntity<ApiResponse<ContractRequirementDto>> rejectRequirement(
            @PathVariable String id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractRequirementDto res = contractService.rejectRequirement(id, reason, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Requirement marked as rejected", res));
    }

    @GetMapping("/requirements/{requirementId}/evidence")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('CONTRACT_VIEW')")
    public ResponseEntity<ApiResponse<List<RequirementEvidenceDto>>> getRequirementEvidence(@PathVariable String requirementId) {
        List<RequirementEvidenceDto> res = contractService.getRequirementEvidenceList(requirementId);
        return ResponseEntity.ok(ApiResponse.success("Evidence mappings retrieved", res));
    }

    @PostMapping("/requirements/evidence/{id}/measurement")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'FIELD_ENGINEER') or hasAuthority('REVIEW_EVIDENCE')")
    public ResponseEntity<ApiResponse<RequirementEvidenceDto>> recordMeasurement(
            @PathVariable String id,
            @Valid @RequestBody RecordMeasurementRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RequirementEvidenceDto res = contractService.recordPhysicalMeasurement(id, req, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Physical measurement recorded and verified", res));
    }

    @PostMapping("/requirements/evidence/{id}/waive")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER') or hasAuthority('CONTRACT_MANAGE')")
    public ResponseEntity<ApiResponse<RequirementEvidenceDto>> waiveRequirement(
            @PathVariable String id,
            @Valid @RequestBody WaiverRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RequirementEvidenceDto res = contractService.waiveRequirementEvidence(id, req, principal.getUser());
        return ResponseEntity.ok(ApiResponse.success("Requirement waived with authorized rationale", res));
    }

    @GetMapping("/projects/{projectId}/compliance")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'FIELD_ENGINEER', 'FINANCE_OFFICER') or hasAuthority('CONTRACT_VIEW')")
    public ResponseEntity<ApiResponse<ContractComplianceSummaryDto>> getProjectCompliance(@PathVariable String projectId) {
        ContractComplianceSummaryDto res = contractService.getProjectComplianceSummary(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project contract compliance summary retrieved", res));
    }
}
