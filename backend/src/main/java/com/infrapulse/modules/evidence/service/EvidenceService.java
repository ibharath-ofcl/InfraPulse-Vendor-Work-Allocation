package com.infrapulse.modules.evidence.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.evidence.dto.*;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.model.EvidenceProcessingStatus;
import com.infrapulse.modules.evidence.model.EvidenceReviewStatus;
import com.infrapulse.modules.evidence.model.StorageProvider;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.storage.EvidenceStorageService;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EvidenceService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceService.class);

    private final WorkEvidenceRepository evidenceRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final VendorRepository vendorRepository;
    private final EvidenceStorageService storageService;
    private final EvidenceValidationService validationService;
    private final EvidenceMetadataService metadataService;
    private final EvidenceProcessingService processingService;
    private final AuditService auditService;

    public EvidenceService(
            WorkEvidenceRepository evidenceRepository,
            WorkAssignmentRepository assignmentRepository,
            VendorRepository vendorRepository,
            EvidenceStorageService storageService,
            EvidenceValidationService validationService,
            EvidenceMetadataService metadataService,
            EvidenceProcessingService processingService,
            AuditService auditService
    ) {
        this.evidenceRepository = evidenceRepository;
        this.assignmentRepository = assignmentRepository;
        this.vendorRepository = vendorRepository;
        this.storageService = storageService;
        this.validationService = validationService;
        this.metadataService = metadataService;
        this.processingService = processingService;
        this.auditService = auditService;
    }

    @Transactional
    public List<EvidenceDetailResponse> uploadEvidence(
            String assignmentId,
            List<MultipartFile> files,
            EvidenceUploadRequest request,
            User currentUser
    ) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one photographic evidence file must be provided.");
        }
        if (files.size() > 10) {
            throw new IllegalArgumentException("Cannot upload more than 10 evidence photographs per request.");
        }

        WorkAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Work assignment not found: " + assignmentId));

        // 1. Assignment Lifecycle check
        if (assignment.getStatus() == AssignmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot upload evidence to a cancelled work assignment.");
        }

        // 2. RBAC & Data Scoping check
        validateAssignmentAccessForUpload(assignment, currentUser);

        List<EvidenceDetailResponse> results = new ArrayList<>();

        for (MultipartFile file : files) {
            // Validate file content, MIME type, magic bytes and dimensions
            EvidenceValidationService.ValidatedImageResult validated = validationService.validateImage(file);
            byte[] fileBytes = file.getBytes();

            // Extract EXIF & metadata
            EvidenceMetadataService.ExtractedMetadata extracted = metadataService.extractMetadata(
                    fileBytes, validated.bufferedImage(), validated.mimeType()
            );

            // Store original file securely
            EvidenceStorageService.StoredFileResult stored = storageService.store(file, assignment.getId());

            // Generate separate thumbnail preview without modifying original
            String previewKey = null;
            if (validated.bufferedImage() != null) {
                byte[] previewBytes = metadataService.generateThumbnail(validated.bufferedImage(), 400);
                if (previewBytes != null && previewBytes.length > 0) {
                    previewKey = storageService.storePreview(previewBytes, assignment.getId(), stored.storageKey(), "jpg");
                }
            }

            // Generate sequential unique evidence code
            Long seq = evidenceRepository.getNextEvidenceSequence();
            String evidenceCode = String.format("EVD-%04d", seq);

            // Create entity record
            WorkEvidence evidence = new WorkEvidence();
            evidence.setEvidenceCode(evidenceCode);
            evidence.setProject(assignment.getProject());
            evidence.setWorkZone(assignment.getWorkZone());
            evidence.setWorkAssignment(assignment);
            evidence.setVendor(assignment.getVendor());
            evidence.setUploadedBy(currentUser);
            evidence.setEvidenceCategory(request.getCategory());
            evidence.setOriginalFileName(stored.originalFileName());
            evidence.setStorageKey(stored.storageKey());
            evidence.setPreviewStorageKey(previewKey);
            evidence.setStorageProvider(StorageProvider.LOCAL);
            evidence.setMimeType(stored.mimeType());
            evidence.setFileSize(stored.fileSize());
            evidence.setChecksumSha256(stored.sha256Checksum());
            evidence.setImageWidth(validated.width());
            evidence.setImageHeight(validated.height());

            // Capture timestamp priority: EXIF > user-provided > uploadedAt
            if (extracted.captureTimestamp() != null) {
                evidence.setCaptureTimestamp(extracted.captureTimestamp());
            } else if (request.getCaptureTimestamp() != null && !request.getCaptureTimestamp().isBlank()) {
                try {
                    evidence.setCaptureTimestamp(Instant.parse(request.getCaptureTimestamp().trim()));
                } catch (Exception ignored) {
                    evidence.setCaptureTimestamp(Instant.now());
                }
            }

            evidence.setDescription(request.getDescription());

            // Location priority: EXIF GPS > user-provided
            if (extracted.latitude() != null && extracted.longitude() != null) {
                evidence.setLatitude(extracted.latitude());
                evidence.setLongitude(extracted.longitude());
            } else if (request.getLatitude() != null && request.getLongitude() != null) {
                evidence.setLatitude(request.getLatitude());
                evidence.setLongitude(request.getLongitude());
            }

            evidence.setMetadataJson(extracted.metadataJson());
            evidence.setProcessingStatus(EvidenceProcessingStatus.READY);
            evidence.setReviewStatus(EvidenceReviewStatus.NOT_REVIEWED);

            WorkEvidence saved = evidenceRepository.save(evidence);

            // Audit Event
            auditService.logEvent(
                    currentUser,
                    "EVIDENCE_UPLOADED",
                    "WorkEvidence",
                    saved.getId(),
                    String.format("Evidence %s uploaded for assignment %s by %s", saved.getEvidenceCode(), assignment.getAssignmentCode(), currentUser.getFullName()),
                    request.getDescription()
            );

            log.info("Photo evidence uploaded: code={}, assignment={}, vendor={}, category={}",
                    saved.getEvidenceCode(), assignment.getAssignmentCode(), assignment.getVendor().getVendorCode(), saved.getEvidenceCategory());

            results.add(EvidenceDetailResponse.fromEntity(saved));
        }

        return results;
    }

    @Transactional(readOnly = true)
    public EvidenceListResponse getAssignmentEvidence(
            String assignmentId,
            EvidenceCategory category,
            Pageable pageable,
            User currentUser
    ) {
        WorkAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Work assignment not found: " + assignmentId));

        validateAssignmentAccessForRead(assignment, currentUser);

        Page<WorkEvidence> page;
        if (category != null) {
            page = evidenceRepository.findByWorkAssignmentIdAndEvidenceCategoryAndIsDeletedFalseOrderByUploadedAtDesc(
                    assignmentId, category, pageable
            );
        } else {
            page = evidenceRepository.findByWorkAssignmentIdAndIsDeletedFalseOrderByUploadedAtDesc(assignmentId, pageable);
        }

        List<EvidenceDetailResponse> dtoList = page.getContent().stream()
                .map(EvidenceDetailResponse::fromEntity)
                .toList();

        return new EvidenceListResponse(dtoList, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public EvidenceDetailResponse getEvidenceById(String evidenceId, User currentUser) {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        auditService.logEvent(
                currentUser,
                "EVIDENCE_VIEWED",
                "WorkEvidence",
                evidence.getId(),
                "Evidence details viewed: " + evidence.getEvidenceCode(),
                null
        );

        return EvidenceDetailResponse.fromEntity(evidence);
    }

    @Transactional(readOnly = true)
    public Resource getEvidenceFile(String evidenceId, User currentUser) throws IOException {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        return storageService.retrieve(evidence.getStorageKey());
    }

    @Transactional(readOnly = true)
    public Resource getEvidencePreview(String evidenceId, User currentUser) throws IOException {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        if (evidence.getPreviewStorageKey() != null) {
            try {
                return storageService.retrieve(evidence.getPreviewStorageKey());
            } catch (Exception e) {
                log.warn("Preview thumbnail unreadable, falling back to original: {}", e.getMessage());
            }
        }
        return storageService.retrieve(evidence.getStorageKey());
    }

    @Transactional(readOnly = true)
    public EvidenceIntegrityResponse verifyIntegrity(String evidenceId, User currentUser) {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        try {
            String calculatedChecksum = storageService.calculateChecksum(evidence.getStorageKey());
            boolean matches = calculatedChecksum.equalsIgnoreCase(evidence.getChecksumSha256());

            auditService.logEvent(
                    currentUser,
                    matches ? "EVIDENCE_INTEGRITY_VERIFIED" : "EVIDENCE_INTEGRITY_FAILED",
                    "WorkEvidence",
                    evidence.getId(),
                    matches ? "Cryptographic SHA-256 integrity match verified" : "Integrity mismatch detected!",
                    String.format("Stored: %s, Calculated: %s", evidence.getChecksumSha256(), calculatedChecksum)
            );

            return new EvidenceIntegrityResponse(
                    evidence.getId(),
                    evidence.getEvidenceCode(),
                    evidence.getChecksumSha256(),
                    calculatedChecksum,
                    matches,
                    Instant.now(),
                    matches ? "SHA-256 Checksum verified authentic and uncorrupted." : "Integrity violation: file checksum does not match persisted fingerprint."
            );
        } catch (Exception e) {
            log.error("Integrity check failed with error: {}", e.getMessage(), e);
            return new EvidenceIntegrityResponse(
                    evidence.getId(),
                    evidence.getEvidenceCode(),
                    evidence.getChecksumSha256(),
                    null,
                    false,
                    Instant.now(),
                    "Integrity verification error: " + e.getMessage()
            );
        }
    }

    @Transactional
    public EvidenceDetailResponse reviewEvidence(String evidenceId, EvidenceReviewRequest request, User currentUser) {
        if (currentUser.getRole() == UserRole.VENDOR) {
            throw new AccessDeniedException("Vendors are strictly prohibited from reviewing or approving their own evidence.");
        }

        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        evidence.setReviewStatus(request.getReviewStatus());
        evidence.setReviewNotes(request.getReviewNotes());
        evidence.setReviewedBy(currentUser);
        evidence.setReviewedAt(Instant.now());

        WorkEvidence updated = evidenceRepository.save(evidence);

        auditService.logEvent(
                currentUser,
                "EVIDENCE_REVIEWED",
                "WorkEvidence",
                updated.getId(),
                String.format("Evidence %s review status updated to %s by %s", updated.getEvidenceCode(), updated.getReviewStatus(), currentUser.getFullName()),
                request.getReviewNotes()
        );

        log.info("Evidence reviewed: code={}, status={}, reviewer={}",
                updated.getEvidenceCode(), updated.getReviewStatus(), currentUser.getFullName());

        return EvidenceDetailResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteEvidence(String evidenceId, String reason, User currentUser) {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        // Only uploader or Admin can withdraw/delete evidence
        boolean isUploader = evidence.getUploadedBy() != null && evidence.getUploadedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.PLATFORM_ADMIN;

        if (!isUploader && !isAdmin) {
            throw new AccessDeniedException("Only the original uploader or a platform administrator can withdraw this evidence.");
        }

        if (evidence.getReviewStatus() == EvidenceReviewStatus.APPROVED && !isAdmin) {
            throw new IllegalStateException("Approved photographic evidence cannot be deleted without administrative override.");
        }

        evidence.setDeleted(true);
        evidenceRepository.save(evidence);

        auditService.logEvent(
                currentUser,
                "EVIDENCE_DELETED",
                "WorkEvidence",
                evidence.getId(),
                String.format("Evidence %s withdrawn/deleted by %s", evidence.getEvidenceCode(), currentUser.getFullName()),
                reason
        );

        log.info("Evidence withdrawn/soft-deleted: code={}, user={}", evidence.getEvidenceCode(), currentUser.getFullName());
    }

    private void validateAssignmentAccessForUpload(WorkAssignment assignment, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN) {
            return;
        }

        if (currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vOpt.isEmpty() || !assignment.getVendor().getId().equals(vOpt.get().getId())) {
                throw new AccessDeniedException("Vendors are only permitted to upload evidence for their own assigned work.");
            }
            return;
        }

        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (assignment.getProject().getProjectManager() != null &&
                !assignment.getProject().getProjectManager().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Project Managers cannot upload evidence for projects they do not manage.");
            }
            return;
        }

        if (currentUser.getRole() == UserRole.FIELD_ENGINEER) {
            return; // Field engineers can upload field documentation for assigned works
        }

        throw new AccessDeniedException("User role is not authorized to submit photographic evidence.");
    }

    private void validateAssignmentAccessForRead(WorkAssignment assignment, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN || currentUser.getRole() == UserRole.FIELD_ENGINEER) {
            return;
        }

        if (currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vOpt.isEmpty() || !assignment.getVendor().getId().equals(vOpt.get().getId())) {
                throw new AccessDeniedException("Vendors cannot view photographic evidence belonging to other vendors.");
            }
            return;
        }

        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            if (assignment.getProject().getProjectManager() != null &&
                !assignment.getProject().getProjectManager().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Project Managers cannot access evidence for projects they do not manage.");
            }
        }
    }

    private void validateEvidenceAccess(WorkEvidence evidence, User currentUser) {
        validateAssignmentAccessForRead(evidence.getWorkAssignment(), currentUser);
    }
}
