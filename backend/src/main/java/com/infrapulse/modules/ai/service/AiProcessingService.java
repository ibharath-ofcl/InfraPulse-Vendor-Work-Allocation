package com.infrapulse.modules.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.ai.client.AiInferenceClient;
import com.infrapulse.modules.ai.dto.*;
import com.infrapulse.modules.ai.entity.AiDetectionResult;
import com.infrapulse.modules.ai.entity.AiImageQualityResult;
import com.infrapulse.modules.ai.entity.AiInferenceResult;
import com.infrapulse.modules.ai.model.AiProcessingStatus;
import com.infrapulse.modules.ai.model.InferenceType;
import com.infrapulse.modules.ai.repository.AiDetectionRepository;
import com.infrapulse.modules.ai.repository.AiImageQualityRepository;
import com.infrapulse.modules.ai.repository.AiInferenceRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.evidence.storage.EvidenceStorageService;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiProcessingService {

    private static final Logger log = LoggerFactory.getLogger(AiProcessingService.class);

    private final AiInferenceRepository inferenceRepository;
    private final AiDetectionRepository detectionRepository;
    private final AiImageQualityRepository imageQualityRepository;
    private final WorkEvidenceRepository evidenceRepository;
    private final EvidenceStorageService storageService;
    private final AiInferenceClient aiInferenceClient;
    private final VendorRepository vendorRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AiProcessingService(
            AiInferenceRepository inferenceRepository,
            AiDetectionRepository detectionRepository,
            AiImageQualityRepository imageQualityRepository,
            WorkEvidenceRepository evidenceRepository,
            EvidenceStorageService storageService,
            AiInferenceClient aiInferenceClient,
            VendorRepository vendorRepository,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.inferenceRepository = inferenceRepository;
        this.detectionRepository = detectionRepository;
        this.imageQualityRepository = imageQualityRepository;
        this.evidenceRepository = evidenceRepository;
        this.storageService = storageService;
        this.aiInferenceClient = aiInferenceClient;
        this.vendorRepository = vendorRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AiInferenceResponse analyzeEvidence(String evidenceId, User currentUser) {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "WorkEvidence not found with id: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        // Retrieve original immutable image bytes from secure storage
        byte[] imageBytes;
        try {
            Resource resource = storageService.retrieve(evidence.getStorageKey());
            imageBytes = resource.getContentAsByteArray();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read evidence image from storage: " + e.getMessage());
        }

        if (imageBytes == null || imageBytes.length == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Original evidence image binary is empty.");
        }

        // Generate unique inference code e.g. INF-AI-2026-001001
        Long seq = inferenceRepository.getNextInferenceSequence();
        if (seq == null) {
            seq = 1L;
        }
        String inferenceCode = String.format("INF-AI-%d-%06d", Year.now().getValue(), seq);

        AiInferenceResult inference = new AiInferenceResult();
        inference.setInferenceCode(inferenceCode);
        inference.setEvidence(evidence);
        inference.setProject(evidence.getProject());
        inference.setAssignment(evidence.getWorkAssignment());
        inference.setModelId("infrapulse-cv-v1");
        inference.setModelVersion("1.0.0");
        inference.setInferenceType(InferenceType.FULL_ANALYSIS);
        inference.setProcessingStatus(AiProcessingStatus.PROCESSING);
        inference.setStartedAt(Instant.now());
        inference.setCreatedBy(currentUser);

        inference = inferenceRepository.save(inference);

        try {
            // Call FastAPI Computer Vision engine
            AiInferenceClient.AiRawAnalysisResult rawResult = aiInferenceClient.analyzeImage(
                    imageBytes, evidence.getOriginalFileName(), evidence.getId()
            );

            // Persist Image Quality Result
            if (rawResult.imageQuality != null) {
                String warningsJson = null;
                try {
                    warningsJson = objectMapper.writeValueAsString(rawResult.imageQuality.getWarnings());
                } catch (JsonProcessingException ignored) {}

                AiImageQualityResult qualityEntity = new AiImageQualityResult();
                qualityEntity.setInference(inference);
                qualityEntity.setResolutionWidth(rawResult.imageQuality.getResolutionWidth());
                qualityEntity.setResolutionHeight(rawResult.imageQuality.getResolutionHeight());
                qualityEntity.setBlurScore(rawResult.imageQuality.getBlurScore());
                qualityEntity.setBrightnessScore(rawResult.imageQuality.getBrightnessScore());
                qualityEntity.setContrastScore(rawResult.imageQuality.getContrastScore());
                qualityEntity.setQualityStatus(rawResult.imageQuality.getQualityStatus());
                qualityEntity.setWarningsJson(warningsJson);

                qualityEntity = imageQualityRepository.save(qualityEntity);
                inference.setImageQuality(qualityEntity);
            }

            // Persist Detection Results
            List<AiDetectionResult> detectionEntities = new ArrayList<>();
            if (rawResult.detections != null) {
                for (AiDetectionDto d : rawResult.detections) {
                    String bbJson = "{}";
                    try {
                        bbJson = objectMapper.writeValueAsString(d.getBoundingBox());
                    } catch (JsonProcessingException ignored) {}

                    AiDetectionResult detEntity = new AiDetectionResult();
                    detEntity.setInference(inference);
                    detEntity.setClassId(d.getClassId());
                    detEntity.setClassLabel(d.getClassLabel());
                    detEntity.setConfidence(d.getConfidence());
                    detEntity.setBoundingBoxJson(bbJson);
                    detEntity.setSegmentationReference(d.getSegmentationReference());

                    detectionEntities.add(detEntity);
                }
                detectionRepository.saveAll(detectionEntities);
            }
            inference.setDetections(detectionEntities);

            // Mark completed
            inference.setProcessingStatus(AiProcessingStatus.COMPLETED);
            inference.setCompletedAt(Instant.now());
            inference.setProcessingDurationMs(rawResult.durationMs);
            inference = inferenceRepository.save(inference);

            auditService.logEvent(
                    currentUser,
                    "AI_INFERENCE_COMPLETED",
                    "AiInference",
                    inference.getId(),
                    "AI computer vision analysis completed: code=" + inference.getInferenceCode() +
                            ", detections=" + detectionEntities.size(),
                    null
            );

            return mapToResponse(inference, rawResult.unsupportedCategories, rawResult.warnings);

        } catch (Exception e) {
            log.error("AI inference pipeline failed for evidenceId={}: {}", evidenceId, e.getMessage());
            inference.setProcessingStatus(AiProcessingStatus.FAILED);
            inference.setCompletedAt(Instant.now());
            inference.setErrorCode("INFERENCE_ERROR");
            inference.setErrorMessage(e.getMessage());
            inferenceRepository.save(inference);

            auditService.logEvent(
                    currentUser,
                    "AI_INFERENCE_FAILED",
                    "AiInference",
                    inference.getId(),
                    "AI computer vision analysis failed: " + e.getMessage(),
                    e.getMessage()
            );

            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI inference execution failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AiInferenceResponse> getEvidenceInferences(String evidenceId, User currentUser) {
        WorkEvidence evidence = evidenceRepository.findByIdAndIsDeletedFalse(evidenceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "WorkEvidence not found with id: " + evidenceId));

        validateEvidenceAccess(evidence, currentUser);

        List<AiInferenceResult> list = inferenceRepository.findByEvidenceIdOrderByCreatedAtDesc(evidenceId);
        return list.stream().map(inf -> mapToResponse(inf, null, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AiInferenceResponse getInferenceById(String inferenceId, User currentUser) {
        AiInferenceResult inference = inferenceRepository.findById(inferenceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AiInference not found with id: " + inferenceId));

        validateEvidenceAccess(inference.getEvidence(), currentUser);

        return mapToResponse(inference, null, null);
    }

    public List<AiModelMetadataDto> getAvailableModels() {
        return aiInferenceClient.getAvailableModels();
    }

    private void validateEvidenceAccess(WorkEvidence evidence, User currentUser) {
        if (currentUser.getRole() == UserRole.PLATFORM_ADMIN || currentUser.getRole() == UserRole.FIELD_ENGINEER) {
            return;
        }
        if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            return;
        }
        if (currentUser.getRole() == UserRole.VENDOR) {
            vendorRepository.findByUserId(currentUser.getId()).ifPresent(vendor -> {
                if (!evidence.getVendor().getId().equals(vendor.getId())) {
                    throw new AccessDeniedException("Vendor isolation: You are not authorized to access this evidence.");
                }
            });
            return;
        }
        throw new AccessDeniedException("Access denied for role: " + currentUser.getRole());
    }

    public AiInferenceResponse mapToResponse(AiInferenceResult inference, List<String> unsupported, List<String> warnings) {
        AiImageQualityDto qualityDto = null;
        if (inference.getImageQuality() != null) {
            AiImageQualityResult q = inference.getImageQuality();
            List<String> qWarnings = new ArrayList<>();
            if (q.getWarningsJson() != null) {
                try {
                    qWarnings = objectMapper.readValue(q.getWarningsJson(), List.class);
                } catch (Exception ignored) {}
            }
            qualityDto = new AiImageQualityDto(
                    q.getResolutionWidth(),
                    q.getResolutionHeight(),
                    q.getBlurScore(),
                    q.getBrightnessScore(),
                    q.getContrastScore(),
                    q.getQualityStatus(),
                    qWarnings
            );
        }

        List<AiDetectionDto> detectionDtos = new ArrayList<>();
        if (inference.getDetections() != null) {
            for (AiDetectionResult d : inference.getDetections()) {
                BoundingBoxDto bb = null;
                if (d.getBoundingBoxJson() != null) {
                    try {
                        bb = objectMapper.readValue(d.getBoundingBoxJson(), BoundingBoxDto.class);
                    } catch (Exception ignored) {}
                }
                detectionDtos.add(new AiDetectionDto(
                        d.getId(),
                        d.getClassId(),
                        d.getClassLabel(),
                        d.getConfidence(),
                        bb,
                        d.getSegmentationReference()
                ));
            }
        }

        if (unsupported == null) {
            unsupported = Arrays.asList(
                    "Trench depth (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
                    "Underground cable installation depth (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
                    "Backfill soil compaction level (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)",
                    "Asphalt layer thickness (REQUIRES_PHYSICAL_MEASUREMENT_OR_HUMAN_VERIFICATION)"
            );
        }

        AiInferenceResponse res = new AiInferenceResponse();
        res.setId(inference.getId());
        res.setInferenceCode(inference.getInferenceCode());
        res.setEvidenceId(inference.getEvidence().getId());
        res.setEvidenceCode(inference.getEvidence().getEvidenceCode());
        res.setProjectId(inference.getProject().getId());
        res.setAssignmentId(inference.getAssignment().getId());
        res.setModelId(inference.getModelId());
        res.setModelVersion(inference.getModelVersion());
        res.setInferenceType(inference.getInferenceType().name());
        res.setProcessingStatus(inference.getProcessingStatus().name());
        res.setStartedAt(inference.getStartedAt());
        res.setCompletedAt(inference.getCompletedAt());
        res.setProcessingDurationMs(inference.getProcessingDurationMs());
        res.setImageQuality(qualityDto);
        res.setDetections(detectionDtos);
        res.setTotalDetections(detectionDtos.size());
        res.setUnsupportedCategories(unsupported);
        res.setWarnings(warnings != null ? warnings : Collections.emptyList());
        res.setErrorCode(inference.getErrorCode());
        res.setErrorMessage(inference.getErrorMessage());
        res.setCreatedAt(inference.getCreatedAt());

        return res;
    }
}
