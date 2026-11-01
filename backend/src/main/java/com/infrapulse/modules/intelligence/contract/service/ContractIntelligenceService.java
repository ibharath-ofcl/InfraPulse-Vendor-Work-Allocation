package com.infrapulse.modules.intelligence.contract.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.intelligence.contract.dto.*;
import com.infrapulse.modules.intelligence.contract.entity.ContractDocument;
import com.infrapulse.modules.intelligence.contract.entity.ContractRequirement;
import com.infrapulse.modules.intelligence.contract.entity.ContractRequirementEvidence;
import com.infrapulse.modules.intelligence.contract.entity.ProjectContract;
import com.infrapulse.modules.intelligence.contract.model.*;
import com.infrapulse.modules.intelligence.contract.repository.ContractDocumentRepository;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementEvidenceRepository;
import com.infrapulse.modules.intelligence.contract.repository.ContractRequirementRepository;
import com.infrapulse.modules.intelligence.contract.repository.ProjectContractRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ContractIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(ContractIntelligenceService.class);

    private final ProjectContractRepository contractRepository;
    private final ContractDocumentRepository documentRepository;
    private final ContractRequirementRepository requirementRepository;
    private final ContractRequirementEvidenceRepository requirementEvidenceRepository;
    private final ProjectRepository projectRepository;
    private final VendorRepository vendorRepository;
    private final WorkZoneRepository workZoneRepository;
    private final ContractExtractionClient extractionClient;
    private final AuditService auditService;

    public ContractIntelligenceService(
            ProjectContractRepository contractRepository,
            ContractDocumentRepository documentRepository,
            ContractRequirementRepository requirementRepository,
            ContractRequirementEvidenceRepository requirementEvidenceRepository,
            ProjectRepository projectRepository,
            VendorRepository vendorRepository,
            WorkZoneRepository workZoneRepository,
            ContractExtractionClient extractionClient,
            AuditService auditService) {
        this.contractRepository = contractRepository;
        this.documentRepository = documentRepository;
        this.requirementRepository = requirementRepository;
        this.requirementEvidenceRepository = requirementEvidenceRepository;
        this.projectRepository = projectRepository;
        this.vendorRepository = vendorRepository;
        this.workZoneRepository = workZoneRepository;
        this.extractionClient = extractionClient;
        this.auditService = auditService;
    }

    @Transactional
    public ContractResponse createContract(CreateContractRequest req, User currentUser) {
        Project project = projectRepository.findById(req.projectId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found: " + req.projectId()));

        Vendor contractor = null;
        if (req.contractorId() != null && !req.contractorId().isBlank()) {
            contractor = vendorRepository.findById(req.contractorId()).orElse(null);
        }

        String contractCode = req.contractCode();
        if (contractCode == null || contractCode.isBlank()) {
            long seq = contractRepository.getNextContractSeq();
            contractCode = "CNT-" + Year.now().getValue() + "-" + String.format("%04d", seq);
        }

        ProjectContract contract = new ProjectContract(
                project,
                contractCode,
                req.title(),
                contractor,
                req.contractType(),
                req.totalValue(),
                currentUser
        );
        contract.setStartDate(req.startDate());
        contract.setEndDate(req.endDate());
        contract.setDescription(req.description());
        contract.setStatus(ContractStatus.ACTIVE);

        ProjectContract saved = contractRepository.save(contract);
        auditService.logEvent(currentUser, "CONTRACT_CREATED", "PROJECT_CONTRACT", saved.getId(),
                "Created project contract: " + saved.getContractCode(), "Initial creation");

        return mapToContractResponse(saved);
    }

    @Transactional(readOnly = true)
    public ContractResponse getContract(String contractId) {
        ProjectContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found: " + contractId));
        return mapToContractResponse(contract);
    }

    @Transactional(readOnly = true)
    public Page<ContractResponse> listContracts(String projectId, ContractStatus status, Pageable pageable) {
        Page<ProjectContract> page;
        if (projectId != null && !projectId.isBlank()) {
            page = contractRepository.findByProjectId(projectId, pageable);
        } else if (status != null) {
            page = contractRepository.findByStatus(status, pageable);
        } else {
            page = contractRepository.findAll(pageable);
        }
        return page.map(this::mapToContractResponse);
    }

    @Transactional
    public ContractResponse uploadAndExtractDocument(String contractId, MultipartFile file, String textFallback, User currentUser) {
        ProjectContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found: " + contractId));

        byte[] bytes = new byte[0];
        String fileName = "contract_specs.txt";
        String fileType = "TXT";
        long size = 0;

        if (file != null && !file.isEmpty()) {
            try {
                bytes = file.getBytes();
                fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
                size = file.getSize();
                fileType = detectFileType(fileName);
            } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read uploaded document: " + e.getMessage());
            }
        } else if (textFallback != null && !textFallback.isBlank()) {
            bytes = textFallback.getBytes();
            size = bytes.length;
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Either document file or text specification must be uploaded");
        }

        String sha256 = computeSha256(bytes);
        String storagePath = "contracts/" + contract.getId() + "/" + fileName;

        // Persist Document Record
        ContractDocument document = new ContractDocument(contract, fileName, fileType, size, storagePath, sha256, currentUser);
        document.setExtractionStatus("EXTRACTING");
        ContractDocument savedDoc = documentRepository.save(document);

        // Run Extraction Pipeline via AI Service
        ContractExtractionClient.ExtractionClientResult extractionResult = extractionClient.extractRequirements(bytes, fileName, textFallback);

        savedDoc.setExtractionStatus("COMPLETED");
        savedDoc.setExtractedTextPreview(extractionResult.previewText);
        savedDoc.setExtractedRequirementsCount(extractionResult.requirements.size());
        documentRepository.save(savedDoc);

        // Generate DRAFT Requirements (Must be reviewed/approved by PM before becoming active)
        long currentReqSeq = requirementRepository.getNextRequirementSeq();
        for (ContractExtractionClient.RawExtractedRequirement r : extractionResult.requirements) {
            String reqCode = "REQ-" + Year.now().getValue() + "-" + String.format("%05d", currentReqSeq++);
            ContractRequirement req = new ContractRequirement(
                    contract,
                    contract.getProject(),
                    reqCode,
                    r.workPackage,
                    r.title,
                    r.description,
                    parseCategory(r.category),
                    r.acceptanceCriteria
            );
            req.setMeasurementUnit(r.measurementUnit);
            req.setRequiredValue(r.requiredValue);
            req.setPermittedTolerance(r.permittedTolerance);
            req.setMandatory(r.mandatory);
            req.setRequiresHumanInspection(r.requiresHumanInspection);
            req.setRequiresPhysicalMeasurement(r.requiresPhysicalMeasurement);
            req.setVerificationMethod(parseVerificationMethod(r.verificationMethod));
            req.setApprovalStatus(RequirementApprovalStatus.DRAFT);

            requirementRepository.save(req);
        }

        auditService.logEvent(currentUser, "CONTRACT_DOCUMENT_EXTRACTED", "CONTRACT_DOCUMENT", savedDoc.getId(),
                "Extracted " + extractionResult.requirements.size() + " requirements from " + fileName, "AI document extraction");

        return mapToContractResponse(contract);
    }

    @Transactional
    public ContractRequirementDto addRequirement(String contractId, CreateRequirementRequest req, User currentUser) {
        ProjectContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Contract not found: " + contractId));

        WorkZone workZone = null;
        if (req.workZoneId() != null && !req.workZoneId().isBlank()) {
            workZone = workZoneRepository.findById(req.workZoneId()).orElse(null);
        }

        long seq = requirementRepository.getNextRequirementSeq();
        String reqCode = "REQ-" + Year.now().getValue() + "-" + String.format("%05d", seq);

        ContractRequirement requirement = new ContractRequirement(
                contract,
                contract.getProject(),
                reqCode,
                req.workPackage(),
                req.title(),
                req.description(),
                req.category() != null ? req.category() : RequirementCategory.SPECIFICATION,
                req.acceptanceCriteria()
        );
        requirement.setWorkZone(workZone);
        requirement.setMeasurementUnit(req.measurementUnit());
        requirement.setRequiredValue(req.requiredValue());
        requirement.setPermittedTolerance(req.permittedTolerance());
        if (req.mandatory() != null) requirement.setMandatory(req.mandatory());
        if (req.requiresHumanInspection() != null) requirement.setRequiresHumanInspection(req.requiresHumanInspection());
        if (req.requiresPhysicalMeasurement() != null) requirement.setRequiresPhysicalMeasurement(req.requiresPhysicalMeasurement());
        if (req.verificationMethod() != null) requirement.setVerificationMethod(req.verificationMethod());
        requirement.setApprovalStatus(RequirementApprovalStatus.DRAFT);

        ContractRequirement saved = requirementRepository.save(requirement);
        auditService.logEvent(currentUser, "REQUIREMENT_CREATED", "CONTRACT_REQUIREMENT", saved.getId(),
                "Created requirement: " + saved.getRequirementCode(), "Manual creation");

        return mapToRequirementDto(saved);
    }

    @Transactional
    public ContractRequirementDto approveRequirement(String requirementId, String notes, User currentUser) {
        ContractRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requirement not found: " + requirementId));

        requirement.setApprovalStatus(RequirementApprovalStatus.APPROVED);
        requirement.setApprovedBy(currentUser);
        requirement.setApprovedAt(Instant.now());
        requirement.setApprovalNotes(notes != null ? notes : "Approved for project work package by Project Manager");

        ContractRequirement saved = requirementRepository.save(requirement);
        auditService.logEvent(currentUser, "REQUIREMENT_APPROVED", "CONTRACT_REQUIREMENT", saved.getId(),
                "Approved requirement: " + saved.getRequirementCode(), notes);

        return mapToRequirementDto(saved);
    }

    @Transactional
    public ContractRequirementDto rejectRequirement(String requirementId, String reason, User currentUser) {
        ContractRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requirement not found: " + requirementId));

        requirement.setApprovalStatus(RequirementApprovalStatus.REJECTED);
        requirement.setApprovedBy(currentUser);
        requirement.setApprovedAt(Instant.now());
        requirement.setApprovalNotes("REJECTED: " + (reason != null ? reason : "Not applicable to scope"));

        ContractRequirement saved = requirementRepository.save(requirement);
        auditService.logEvent(currentUser, "REQUIREMENT_REJECTED", "CONTRACT_REQUIREMENT", saved.getId(),
                "Rejected requirement: " + saved.getRequirementCode(), reason);

        return mapToRequirementDto(saved);
    }

    @Transactional
    public RequirementEvidenceDto recordPhysicalMeasurement(String reqEvidenceId, RecordMeasurementRequest req, User currentUser) {
        ContractRequirementEvidence evid = requirementEvidenceRepository.findById(reqEvidenceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requirement evidence record not found: " + reqEvidenceId));

        evid.setMeasuredValue(req.measuredValue());
        evid.setMeasurementUnit(req.measurementUnit() != null ? req.measurementUnit() : evid.getRequirement().getMeasurementUnit());
        evid.setPhysicalMeasurementTool(req.physicalMeasurementTool());
        evid.setMeasurementNotes(req.measurementNotes());
        evid.setMeasuredBy(currentUser);
        evid.setMeasuredAt(Instant.now());
        evid.setStatus(RequirementEvidenceStatus.VERIFIED);
        evid.setVerifiedAt(Instant.now());

        ContractRequirementEvidence saved = requirementEvidenceRepository.save(evid);
        auditService.logEvent(currentUser, "PHYSICAL_MEASUREMENT_RECORDED", "CONTRACT_REQUIREMENT_EVIDENCE", saved.getId(),
                "Recorded measurement " + req.measuredValue() + " for requirement " + saved.getRequirement().getRequirementCode(),
                req.physicalMeasurementTool());

        return mapToRequirementEvidenceDto(saved);
    }

    @Transactional
    public RequirementEvidenceDto waiveRequirementEvidence(String reqEvidenceId, WaiverRequest req, User currentUser) {
        ContractRequirementEvidence evid = requirementEvidenceRepository.findById(reqEvidenceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requirement evidence record not found: " + reqEvidenceId));

        evid.setStatus(RequirementEvidenceStatus.WAIVED_WITH_AUTHORIZATION);
        evid.setWaiverReason(req.waiverReason());
        evid.setWaivedBy(currentUser);
        evid.setVerifiedAt(Instant.now());

        ContractRequirementEvidence saved = requirementEvidenceRepository.save(evid);
        auditService.logEvent(currentUser, "REQUIREMENT_WAIVED_WITH_AUTHORIZATION", "CONTRACT_REQUIREMENT_EVIDENCE", saved.getId(),
                "Authorized waiver for requirement: " + saved.getRequirement().getRequirementCode(), req.waiverReason());

        return mapToRequirementEvidenceDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ContractRequirementDto> getContractRequirements(String contractId) {
        return requirementRepository.findByContractId(contractId).stream()
                .map(this::mapToRequirementDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ContractRequirementDto> getProjectRequirements(String projectId, RequirementCategory category, RequirementApprovalStatus status, Pageable pageable) {
        return requirementRepository.searchRequirements(projectId, category, status, pageable)
                .map(this::mapToRequirementDto);
    }

    @Transactional(readOnly = true)
    public List<RequirementEvidenceDto> getRequirementEvidenceList(String requirementId) {
        return requirementEvidenceRepository.findByRequirementId(requirementId).stream()
                .map(this::mapToRequirementEvidenceDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractComplianceSummaryDto getProjectComplianceSummary(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found: " + projectId));

        List<ProjectContract> contracts = contractRepository.findByProjectId(projectId);
        List<ContractRequirement> requirements = requirementRepository.findByProjectId(projectId);

        long totalReqs = requirements.size();
        long approvedReqs = requirements.stream().filter(r -> r.getApprovalStatus() == RequirementApprovalStatus.APPROVED).count();
        long draftReqs = requirements.stream().filter(r -> r.getApprovalStatus() == RequirementApprovalStatus.DRAFT).count();
        long physReqCount = requirements.stream().filter(ContractRequirement::isRequiresPhysicalMeasurement).count();

        long verifiedEvidenceCount = requirementEvidenceRepository.countCompliantByProjectId(projectId);
        long totalEvidenceRecords = requirementEvidenceRepository.countTotalByProjectId(projectId);
        long pendingEvidenceCount = requirementEvidenceRepository.countByProjectIdAndStatus(projectId, RequirementEvidenceStatus.EVIDENCE_PENDING);
        long nonCompliantCount = requirementEvidenceRepository.countByProjectIdAndStatus(projectId, RequirementEvidenceStatus.NON_COMPLIANT);

        double compliancePercentage = totalReqs > 0
                ? Math.round(((double) verifiedEvidenceCount / (double) Math.max(1, totalEvidenceRecords)) * 1000.0) / 10.0
                : 0.0;
        if (compliancePercentage > 100.0) compliancePercentage = 100.0;

        Map<String, Long> byCategory = requirements.stream()
                .collect(Collectors.groupingBy(r -> r.getCategory().name(), Collectors.counting()));

        Map<String, Long> statusBreakdown = requirements.stream()
                .collect(Collectors.groupingBy(r -> r.getApprovalStatus().name(), Collectors.counting()));

        return new ContractComplianceSummaryDto(
                project.getId(),
                project.getProjectName(),
                contracts.size(),
                totalReqs,
                approvedReqs,
                draftReqs,
                verifiedEvidenceCount,
                pendingEvidenceCount,
                nonCompliantCount,
                physReqCount,
                compliancePercentage,
                byCategory,
                statusBreakdown
        );
    }

    private ContractResponse mapToContractResponse(ProjectContract contract) {
        List<ContractRequirement> reqs = requirementRepository.findByContractId(contract.getId());
        long total = reqs.size();
        long approved = reqs.stream().filter(r -> r.getApprovalStatus() == RequirementApprovalStatus.APPROVED).count();
        long verified = requirementEvidenceRepository.countCompliantByProjectId(contract.getProject().getId());

        double compliance = total > 0 ? Math.round(((double) verified / (double) total) * 1000.0) / 10.0 : 0.0;
        if (compliance > 100.0) compliance = 100.0;

        return new ContractResponse(
                contract.getId(),
                contract.getContractCode(),
                contract.getProject().getId(),
                contract.getProject().getProjectName(),
                contract.getTitle(),
                contract.getContractor() != null ? contract.getContractor().getId() : null,
                contract.getContractor() != null ? contract.getContractor().getCompanyName() : "Unassigned",
                contract.getContractType(),
                contract.getTotalValue(),
                contract.getStatus(),
                contract.getVersionNumber(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getDescription(),
                total,
                approved,
                verified,
                compliance,
                contract.getCreatedAt()
        );
    }

    private ContractRequirementDto mapToRequirementDto(ContractRequirement req) {
        long evidenceCount = requirementEvidenceRepository.findByRequirementId(req.getId()).size();
        return new ContractRequirementDto(
                req.getId(),
                req.getRequirementCode(),
                req.getContract().getId(),
                req.getContract().getContractCode(),
                req.getProject().getId(),
                req.getProject().getProjectName(),
                req.getWorkPackage(),
                req.getWorkZone() != null ? req.getWorkZone().getId() : null,
                req.getWorkZone() != null ? req.getWorkZone().getZoneName() : "All Zones",
                req.getTitle(),
                req.getDescription(),
                req.getCategory(),
                req.getAcceptanceCriteria(),
                req.getMeasurementUnit(),
                req.getRequiredValue(),
                req.getPermittedTolerance(),
                req.isMandatory(),
                req.isRequiresHumanInspection(),
                req.isRequiresPhysicalMeasurement(),
                req.getVerificationMethod(),
                req.getApprovalStatus(),
                req.getApprovedBy() != null ? req.getApprovedBy().getId() : null,
                req.getApprovedBy() != null ? req.getApprovedBy().getFullName() : null,
                req.getApprovedAt(),
                req.getApprovalNotes(),
                evidenceCount,
                req.getCreatedAt()
        );
    }

    private RequirementEvidenceDto mapToRequirementEvidenceDto(ContractRequirementEvidence e) {
        return new RequirementEvidenceDto(
                e.getId(),
                e.getRequirement().getId(),
                e.getRequirement().getRequirementCode(),
                e.getRequirement().getTitle(),
                e.getEvidence() != null ? e.getEvidence().getId() : null,
                e.getEvidence() != null ? e.getEvidence().getEvidenceCode() : null,
                e.getEvidence() != null ? (e.getEvidence().getPreviewStorageKey() != null ? e.getEvidence().getPreviewStorageKey() : e.getEvidence().getStorageKey()) : null,
                e.getAssignment() != null ? e.getAssignment().getId() : null,
                e.getAssignment() != null ? e.getAssignment().getAssignmentCode() : null,
                e.getStatus(),
                e.getMeasuredValue(),
                e.getMeasurementUnit(),
                e.getPhysicalMeasurementTool(),
                e.getMeasurementNotes(),
                e.getMeasuredBy() != null ? e.getMeasuredBy().getId() : null,
                e.getMeasuredBy() != null ? e.getMeasuredBy().getFullName() : null,
                e.getMeasuredAt(),
                e.getWaiverReason(),
                e.getWaivedBy() != null ? e.getWaivedBy().getId() : null,
                e.getWaivedBy() != null ? e.getWaivedBy().getFullName() : null,
                e.getVerifiedAt(),
                e.getCreatedAt()
        );
    }

    private RequirementCategory parseCategory(String raw) {
        if (raw == null) return RequirementCategory.SPECIFICATION;
        try {
            return RequirementCategory.valueOf(raw.toUpperCase());
        } catch (Exception e) {
            return RequirementCategory.SPECIFICATION;
        }
    }

    private VerificationMethod parseVerificationMethod(String raw) {
        if (raw == null) return VerificationMethod.PHOTO_EVIDENCE;
        try {
            return VerificationMethod.valueOf(raw.toUpperCase());
        } catch (Exception e) {
            return VerificationMethod.PHOTO_EVIDENCE;
        }
    }

    private String detectFileType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".pdf")) return "PDF";
        if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "DOCX";
        if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "XLSX";
        return "TXT";
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }
}
