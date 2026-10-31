package com.infrapulse.modules.evidence.service;

import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceProcessingStatus;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.storage.EvidenceStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

@Service
public class EvidenceProcessingService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceProcessingService.class);

    private final WorkEvidenceRepository evidenceRepository;
    private final EvidenceStorageService storageService;

    public EvidenceProcessingService(WorkEvidenceRepository evidenceRepository, EvidenceStorageService storageService) {
        this.evidenceRepository = evidenceRepository;
        this.storageService = storageService;
    }

    @Transactional
    public void prepareForAiProcessing(WorkEvidence evidence) {
        evidence.setProcessingStatus(EvidenceProcessingStatus.READY);
        evidenceRepository.save(evidence);
        log.info("Evidence prepared for AI analysis: code={}, id={}", evidence.getEvidenceCode(), evidence.getId());
    }

    @Transactional
    public void markProcessingStatus(String evidenceId, EvidenceProcessingStatus status, String notes) {
        WorkEvidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence record not found: " + evidenceId));
        evidence.setProcessingStatus(status);
        if (notes != null && !notes.isBlank()) {
            evidence.setReviewNotes(notes);
        }
        evidenceRepository.save(evidence);
        log.info("Evidence processing status updated: id={}, status={}", evidenceId, status);
    }

    @Transactional(readOnly = true)
    public EvidenceProcessingPackage getProcessingPackage(String evidenceId) throws IOException {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence record not found or withdrawn: " + evidenceId));

        Resource imageResource = storageService.retrieve(evidence.getStorageKey());
        return new EvidenceProcessingPackage(
                evidence.getId(),
                evidence.getEvidenceCode(),
                evidence.getWorkAssignment().getId(),
                evidence.getWorkAssignment().getAssignmentCode(),
                evidence.getWorkAssignment().getWorkType().name(),
                evidence.getStorageKey(),
                evidence.getMimeType(),
                evidence.getFileSize(),
                evidence.getChecksumSha256(),
                evidence.getImageWidth(),
                evidence.getImageHeight(),
                evidence.getMetadataJson(),
                imageResource
        );
    }

    public record EvidenceProcessingPackage(
            String evidenceId,
            String evidenceCode,
            String assignmentId,
            String assignmentCode,
            String workType,
            String storageKey,
            String mimeType,
            long fileSize,
            String checksumSha256,
            Integer imageWidth,
            Integer imageHeight,
            String metadataJson,
            Resource imageResource
    ) {}
}
