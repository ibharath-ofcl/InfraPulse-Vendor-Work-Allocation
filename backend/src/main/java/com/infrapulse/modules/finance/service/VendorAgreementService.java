package com.infrapulse.modules.finance.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.finance.dto.*;
import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.entity.VendorAgreementVersion;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import com.infrapulse.modules.finance.repository.VendorAgreementRepository;
import com.infrapulse.modules.finance.repository.VendorAgreementVersionRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.project.repository.ProjectVendorRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorAgreementService {

    private static final Logger log = LoggerFactory.getLogger(VendorAgreementService.class);

    private final VendorAgreementRepository agreementRepository;
    private final VendorAgreementVersionRepository versionRepository;
    private final ProjectRepository projectRepository;
    private final VendorRepository vendorRepository;
    private final ProjectVendorRepository projectVendorRepository;
    private final AuditService auditService;
    private final EntityManager entityManager;

    public VendorAgreementService(
            VendorAgreementRepository agreementRepository,
            VendorAgreementVersionRepository versionRepository,
            ProjectRepository projectRepository,
            VendorRepository vendorRepository,
            ProjectVendorRepository projectVendorRepository,
            AuditService auditService,
            EntityManager entityManager) {
        this.agreementRepository = agreementRepository;
        this.versionRepository = versionRepository;
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
        this.projectVendorRepository = projectVendorRepository;
        this.auditService = auditService;
        this.entityManager = entityManager;
    }

    @Transactional
    public VendorAgreementResponse createAgreement(CreateAgreementRequest request, User currentUser) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found with id: " + request.getProjectId()));

        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found with id: " + request.getVendorId()));

        if (!projectVendorRepository.hasActiveAssociation(project.getId(), vendor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor " + vendor.getCompanyName() + " is not actively associated with project " + project.getProjectName());
        }

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Contract start date cannot be after end date");
        }

        if (request.getContractValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Contract value must be greater than zero");
        }

        String agreementCode = generateAgreementCode();

        VendorAgreement agreement = new VendorAgreement();
        agreement.setAgreementCode(agreementCode);
        agreement.setProject(project);
        agreement.setVendor(vendor);
        agreement.setContractReference(request.getContractReference());
        agreement.setContractValue(request.getContractValue());
        agreement.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        agreement.setPaymentTerms(request.getPaymentTerms());
        agreement.setRetentionPercentage(request.getRetentionPercentage() != null ? request.getRetentionPercentage() : BigDecimal.ZERO);
        agreement.setTaxPercentage(request.getTaxPercentage() != null ? request.getTaxPercentage() : BigDecimal.ZERO);
        agreement.setStartDate(request.getStartDate());
        agreement.setEndDate(request.getEndDate());
        agreement.setStatus(AgreementStatus.ACTIVE);
        agreement.setCurrentVersion(1);
        agreement.setSupportingDocumentUrl(request.getSupportingDocumentUrl());
        agreement.setCreatedBy(currentUser);

        VendorAgreement saved = agreementRepository.save(agreement);

        // Version 1 snapshot
        VendorAgreementVersion version1 = new VendorAgreementVersion();
        version1.setAgreement(saved);
        version1.setVersionNumber(1);
        version1.setContractValue(saved.getContractValue());
        version1.setCurrency(saved.getCurrency());
        version1.setPaymentTerms(saved.getPaymentTerms());
        version1.setRetentionPercentage(saved.getRetentionPercentage());
        version1.setTaxPercentage(saved.getTaxPercentage());
        version1.setCommercialTermsSnapshot(buildSnapshot(saved));
        version1.setChangeReason("Initial Commercial Agreement Creation");
        version1.setChangedBy(currentUser);
        version1.setApprovedBy(currentUser);
        versionRepository.save(version1);

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "AGREEMENT_CREATED",
                "VENDOR_AGREEMENT",
                saved.getId(),
                "Created commercial agreement " + saved.getAgreementCode() + " for vendor " + vendor.getCompanyName(),
                "Contract value: " + saved.getCurrency() + " " + saved.getContractValue()
        );

        log.info("Commercial agreement created: code={}, project={}, vendor={}, value={}",
                saved.getAgreementCode(), project.getProjectCode(), vendor.getVendorCode(), saved.getContractValue());

        return mapToResponse(saved);
    }

    @Transactional
    public VendorAgreementResponse updateAgreement(String agreementId, UpdateAgreementRequest request, User currentUser) {
        VendorAgreement agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Agreement not found with id: " + agreementId));

        if (agreement.getStatus() == AgreementStatus.TERMINATED || agreement.getStatus() == AgreementStatus.EXPIRED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot modify an agreement with status: " + agreement.getStatus());
        }

        boolean termsChanged = !agreement.getContractValue().equals(request.getContractValue()) ||
                !agreement.getRetentionPercentage().equals(request.getRetentionPercentage()) ||
                !agreement.getTaxPercentage().equals(request.getTaxPercentage()) ||
                (request.getPaymentTerms() != null && !request.getPaymentTerms().equals(agreement.getPaymentTerms()));

        int nextVersion = agreement.getCurrentVersion();
        if (termsChanged) {
            nextVersion++;
            agreement.setCurrentVersion(nextVersion);

            VendorAgreementVersion version = new VendorAgreementVersion();
            version.setAgreement(agreement);
            version.setVersionNumber(nextVersion);
            version.setContractValue(request.getContractValue());
            version.setCurrency(agreement.getCurrency());
            version.setPaymentTerms(request.getPaymentTerms());
            version.setRetentionPercentage(request.getRetentionPercentage());
            version.setTaxPercentage(request.getTaxPercentage());
            version.setCommercialTermsSnapshot(buildSnapshot(agreement));
            version.setChangeReason(request.getChangeReason());
            version.setChangedBy(currentUser);
            version.setApprovedBy(currentUser);
            versionRepository.save(version);
        }

        agreement.setContractReference(request.getContractReference());
        agreement.setContractValue(request.getContractValue());
        if (request.getPaymentTerms() != null) agreement.setPaymentTerms(request.getPaymentTerms());
        if (request.getRetentionPercentage() != null) agreement.setRetentionPercentage(request.getRetentionPercentage());
        if (request.getTaxPercentage() != null) agreement.setTaxPercentage(request.getTaxPercentage());
        if (request.getStartDate() != null) agreement.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) agreement.setEndDate(request.getEndDate());
        if (request.getStatus() != null) agreement.setStatus(request.getStatus());
        if (request.getSupportingDocumentUrl() != null) agreement.setSupportingDocumentUrl(request.getSupportingDocumentUrl());

        VendorAgreement updated = agreementRepository.save(agreement);

        auditService.recordEvent(
                currentUser != null ? currentUser.getId() : null,
                "AGREEMENT_MODIFIED",
                "VENDOR_AGREEMENT",
                updated.getId(),
                "Updated commercial agreement " + updated.getAgreementCode() + " to version " + nextVersion,
                request.getChangeReason()
        );

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public VendorAgreementResponse getAgreementById(String agreementId) {
        VendorAgreement agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Agreement not found with id: " + agreementId));
        return mapToResponse(agreement);
    }

    @Transactional(readOnly = true)
    public List<VendorAgreementResponse> getAgreementsByProject(String projectId) {
        return agreementRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VendorAgreementResponse> getAgreementsByVendor(String vendorId) {
        return agreementRepository.findByVendorId(vendorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<VendorAgreementResponse> getAgreements(Pageable pageable) {
        return agreementRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<VendorAgreementVersionResponse> getAgreementVersions(String agreementId) {
        return versionRepository.findByAgreementIdOrderByVersionNumberDesc(agreementId).stream()
                .map(this::mapVersionToResponse)
                .collect(Collectors.toList());
    }

    private String generateAgreementCode() {
        try {
            Object res = entityManager.createNativeQuery("SELECT nextval('agreement_seq')").getSingleResult();
            long nextVal = res instanceof BigInteger ? ((BigInteger) res).longValue() : ((Number) res).longValue();
            return String.format("AGR-%04d", nextVal);
        } catch (Exception e) {
            return "AGR-" + System.currentTimeMillis() % 100000;
        }
    }

    private String buildSnapshot(VendorAgreement agreement) {
        return String.format(
                "{\"contractValue\":%s,\"currency\":\"%s\",\"retentionPercentage\":%s,\"taxPercentage\":%s,\"paymentTerms\":\"%s\"}",
                agreement.getContractValue(),
                agreement.getCurrency(),
                agreement.getRetentionPercentage(),
                agreement.getTaxPercentage(),
                agreement.getPaymentTerms() != null ? agreement.getPaymentTerms().replace("\"", "\\\"") : ""
        );
    }

    public VendorAgreementResponse mapToResponse(VendorAgreement a) {
        VendorAgreementResponse dto = new VendorAgreementResponse();
        dto.setId(a.getId());
        dto.setAgreementCode(a.getAgreementCode());
        if (a.getProject() != null) {
            dto.setProjectId(a.getProject().getId());
            dto.setProjectName(a.getProject().getProjectName());
        }
        if (a.getVendor() != null) {
            dto.setVendorId(a.getVendor().getId());
            dto.setVendorCode(a.getVendor().getVendorCode());
            dto.setVendorName(a.getVendor().getCompanyName());
        }
        dto.setContractReference(a.getContractReference());
        dto.setContractValue(a.getContractValue());
        dto.setCurrency(a.getCurrency());
        dto.setPaymentTerms(a.getPaymentTerms());
        dto.setRetentionPercentage(a.getRetentionPercentage());
        dto.setTaxPercentage(a.getTaxPercentage());
        dto.setStartDate(a.getStartDate());
        dto.setEndDate(a.getEndDate());
        dto.setStatus(a.getStatus());
        dto.setCurrentVersion(a.getCurrentVersion());
        dto.setSupportingDocumentUrl(a.getSupportingDocumentUrl());
        if (a.getCreatedBy() != null) {
            dto.setCreatedById(a.getCreatedBy().getId());
            dto.setCreatedByName(a.getCreatedBy().getFullName());
        }
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }

    public VendorAgreementVersionResponse mapVersionToResponse(VendorAgreementVersion v) {
        VendorAgreementVersionResponse dto = new VendorAgreementVersionResponse();
        dto.setId(v.getId());
        dto.setAgreementId(v.getAgreement().getId());
        dto.setVersionNumber(v.getVersionNumber());
        dto.setContractValue(v.getContractValue());
        dto.setCurrency(v.getCurrency());
        dto.setPaymentTerms(v.getPaymentTerms());
        dto.setRetentionPercentage(v.getRetentionPercentage());
        dto.setTaxPercentage(v.getTaxPercentage());
        dto.setCommercialTermsSnapshot(v.getCommercialTermsSnapshot());
        dto.setChangeReason(v.getChangeReason());
        if (v.getChangedBy() != null) {
            dto.setChangedById(v.getChangedBy().getId());
            dto.setChangedByName(v.getChangedBy().getFullName());
        }
        if (v.getApprovedBy() != null) {
            dto.setApprovedById(v.getApprovedBy().getId());
            dto.setApprovedByName(v.getApprovedBy().getFullName());
        }
        dto.setCreatedAt(v.getCreatedAt());
        return dto;
    }
}
