package com.infrapulse.modules.quality.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.ai.entity.AiDetectionResult;
import com.infrapulse.modules.ai.entity.AiInferenceResult;
import com.infrapulse.modules.ai.repository.AiInferenceRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.quality.dto.QualityAssessmentResponse;
import com.infrapulse.modules.quality.dto.QualityTemplateDto;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.entity.QualityInspectionCriterion;
import com.infrapulse.modules.quality.entity.QualityInspectionTemplate;
import com.infrapulse.modules.quality.model.AssessmentStatus;
import com.infrapulse.modules.quality.model.CriterionCategory;
import com.infrapulse.modules.quality.model.FindingOutcome;
import com.infrapulse.modules.quality.model.FindingSeverity;
import com.infrapulse.modules.quality.repository.QualityAssessmentFindingRepository;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.quality.repository.QualityInspectionCriterionRepository;
import com.infrapulse.modules.quality.repository.QualityInspectionTemplateRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QualityInspectionService {

    private static final Logger log = LoggerFactory.getLogger(QualityInspectionService.class);

    private final QualityInspectionTemplateRepository templateRepository;
    private final QualityInspectionCriterionRepository criterionRepository;
    private final QualityAssessmentRepository assessmentRepository;
    private final QualityAssessmentFindingRepository findingRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final WorkEvidenceRepository evidenceRepository;
    private final AiInferenceRepository inferenceRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final com.infrapulse.modules.humanreview.service.HumanReviewService humanReviewService;

    public QualityInspectionService(
            QualityInspectionTemplateRepository templateRepository,
            QualityInspectionCriterionRepository criterionRepository,
            QualityAssessmentRepository assessmentRepository,
            QualityAssessmentFindingRepository findingRepository,
            WorkAssignmentRepository assignmentRepository,
            WorkEvidenceRepository evidenceRepository,
            AiInferenceRepository inferenceRepository,
            AuditService auditService,
            ObjectMapper objectMapper,
            @Lazy com.infrapulse.modules.humanreview.service.HumanReviewService humanReviewService) {
        this.templateRepository = templateRepository;
        this.criterionRepository = criterionRepository;
        this.assessmentRepository = assessmentRepository;
        this.findingRepository = findingRepository;
        this.assignmentRepository = assignmentRepository;
        this.evidenceRepository = evidenceRepository;
        this.inferenceRepository = inferenceRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.humanReviewService = humanReviewService;
    }

    @Transactional
    public QualityAssessmentResponse assessAssignmentQuality(
            String assignmentId,
            String predecessorAssessmentId,
            User currentUser) {

        WorkAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "WorkAssignment not found: " + assignmentId));

        // Find active checklist template matching work type
        QualityInspectionTemplate template = templateRepository
                .findFirstByWorkTypeAndIsActiveTrueOrderByVersionDesc(assignment.getWorkType())
                .orElseGet(() -> {
                    // Fallback to final inspection if specific template not found
                    return templateRepository.findFirstByWorkTypeAndIsActiveTrueOrderByVersionDesc(
                            com.infrapulse.modules.workassignment.enums.WorkType.FINAL_INSPECTION
                    ).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                            "No active inspection template found for work type: " + assignment.getWorkType()));
                });

        List<QualityInspectionCriterion> criteria = criterionRepository.findByTemplateIdOrderByOrderIndexAsc(template.getId());

        // Retrieve submitted photo evidence
        List<WorkEvidence> evidences = evidenceRepository.findByWorkAssignmentIdAndIsDeletedFalse(assignmentId);

        // Retrieve AI inference records for the assignment
        List<AiInferenceResult> inferences = inferenceRepository.findByAssignmentIdOrderByCreatedAtDesc(assignmentId);

        // Map evidence ID to list of detections
        Map<String, List<AiDetectionResult>> evidenceDetectionsMap = new HashMap<>();
        for (AiInferenceResult inf : inferences) {
            if (inf.getEvidence() != null && inf.getDetections() != null) {
                evidenceDetectionsMap.computeIfAbsent(inf.getEvidence().getId(), k -> new ArrayList<>())
                        .addAll(inf.getDetections());
            }
        }

        // Determine revision number
        int revision = 1;
        QualityAssessment predecessor = null;
        if (predecessorAssessmentId != null) {
            predecessor = assessmentRepository.findById(predecessorAssessmentId).orElse(null);
            if (predecessor != null) {
                revision = predecessor.getRevisionNumber() + 1;
            }
        }

        // Generate Assessment Code: QA-2026-001001
        Long seq = assessmentRepository.getNextAssessmentSequence();
        if (seq == null) seq = 1L;
        String assessmentCode = String.format("QA-%d-%06d", Year.now().getValue(), seq);

        QualityAssessment assessment = new QualityAssessment();
        assessment.setAssessmentCode(assessmentCode);
        assessment.setAssignment(assignment);
        assessment.setTemplate(template);
        assessment.setTemplateVersion(template.getVersion());
        assessment.setRevisionNumber(revision);
        assessment.setPredecessorAssessment(predecessor);
        assessment.setCreatedBy(currentUser);
        assessment.setCreatedAt(Instant.now());
        assessment.setUpdatedAt(Instant.now());

        // Evaluate Criteria and Build Findings
        List<QualityAssessmentFinding> findings = new ArrayList<>();
        int passedCount = 0;
        int flaggedCount = 0;
        int failedCount = 0;

        Set<EvidenceCategory> presentCategories = evidences.stream()
                .map(WorkEvidence::getEvidenceCategory)
                .collect(Collectors.toSet());

        double completenessScore = evidences.isEmpty() ? 0.0 : Math.min(100.0, (presentCategories.size() / 3.0) * 100.0);
        assessment.setEvidenceCompletenessScore(completenessScore);

        for (QualityInspectionCriterion crit : criteria) {
            QualityAssessmentFinding finding = new QualityAssessmentFinding();
            finding.setAssessment(assessment);
            finding.setCriterion(crit);
            finding.setCriterionCode(crit.getCriterionCode());
            finding.setCriterionName(crit.getName());
            finding.setSeverity(crit.getSeverity());

            if (crit.getCategory() == CriterionCategory.EVIDENCE_COMPLETENESS) {
                if (evidences.size() < 2) {
                    finding.setOutcome(FindingOutcome.FAIL);
                    finding.setTitle("Insufficient Photographic Evidence");
                    finding.setDescription("Only " + evidences.size() + " photo evidence submitted. Minimum 2 distinct captures required across work phases.");
                    finding.setTechnicalNotes("Mandatory categories require: BEFORE_WORK/WORK_IN_PROGRESS and AFTER_WORK.");
                    finding.setSuggestedAction("Request additional photographic evidence documenting required phases.");
                    failedCount++;
                } else {
                    finding.setOutcome(FindingOutcome.PASS);
                    finding.setTitle("Evidence Completeness Satisfied");
                    finding.setDescription("Adequate photographic records submitted (" + evidences.size() + " items, " + presentCategories.size() + " categories).");
                    passedCount++;
                }
            } else if (crit.getCategory() == CriterionCategory.IMAGE_QUALITY) {
                boolean hasLowQuality = inferences.stream()
                        .anyMatch(inf -> inf.getImageQuality() != null && "POOR_QUALITY".equalsIgnoreCase(inf.getImageQuality().getQualityStatus()));

                if (hasLowQuality) {
                    finding.setOutcome(FindingOutcome.REQUIRES_HUMAN_REVIEW);
                    finding.setTitle("Image Optical Quality Warning");
                    finding.setDescription("One or more evidence photographs exhibited high blur or severe contrast degradation.");
                    finding.setTechnicalNotes("Automated clarity checks flagged optical variance below quality threshold.");
                    finding.setSuggestedAction("Field Engineer should inspect original photo or request resubmission.");
                    flaggedCount++;
                } else {
                    finding.setOutcome(FindingOutcome.PASS);
                    finding.setTitle("Optical Clarity Meets Acceptance Standard");
                    finding.setDescription("Submitted evidence has acceptable sharpness, brightness, and contrast.");
                    passedCount++;
                }
            } else if (crit.getCategory() == CriterionCategory.VISUAL_DETECTION) {
                String targetClass = crit.getTargetDetectionClass();
                List<AiDetectionResult> targetDetections = new ArrayList<>();
                for (List<AiDetectionResult> dets : evidenceDetectionsMap.values()) {
                    for (AiDetectionResult d : dets) {
                        if (targetClass != null && targetClass.equalsIgnoreCase(d.getClassId())) {
                            targetDetections.add(d);
                        }
                    }
                }

                if (!targetDetections.isEmpty()) {
                    AiDetectionResult firstDet = targetDetections.get(0);
                    finding.setOutcome(crit.isMandatory() ? FindingOutcome.FAIL : FindingOutcome.REQUIRES_HUMAN_REVIEW);
                    finding.setTitle("Visual Defect Identified: " + firstDet.getClassLabel());
                    finding.setDescription("AI computer vision detected " + targetDetections.size() + " instances of " +
                            firstDet.getClassLabel() + " with confidence up to " +
                            String.format("%.1f%%", firstDet.getConfidence() * 100));
                    if (firstDet.getInference() != null && firstDet.getInference().getEvidence() != null) {
                        finding.setEvidence(firstDet.getInference().getEvidence());
                    }
                    finding.setDetectionId(firstDet.getId());
                    finding.setTechnicalNotes("Detection coordinates: " + firstDet.getBoundingBoxJson());
                    finding.setSuggestedAction("Field inspection required to determine if structural rework or patching is necessary.");
                    if (crit.isMandatory()) {
                        failedCount++;
                    } else {
                        flaggedCount++;
                    }
                } else {
                    finding.setOutcome(FindingOutcome.PASS);
                    finding.setTitle("No " + crit.getName() + " Detected");
                    finding.setDescription("Computer vision analysis found no visual indications of " +
                            (targetClass != null ? targetClass : "defects") + ".");
                    passedCount++;
                }
            } else if (crit.getCategory() == CriterionCategory.PHYSICAL_MEASUREMENT) {
                // Rule 6: No fabricated engineering standards. 2D photos cannot verify hidden dimensions.
                finding.setOutcome(FindingOutcome.REQUIRES_PHYSICAL_MEASUREMENT);
                finding.setTitle("Physical Measurement Required: " + crit.getName());
                finding.setDescription("Standard 2D photographic evidence cannot reliably verify hidden engineering dimensions or soil compaction. Must be physically confirmed against project specification.");
                finding.setTechnicalNotes("Requires authorized inspector tool calibration and applicable specification reference.");
                finding.setSuggestedAction("Inspector must record and verify on-site calibrated physical measurement before approval.");
                flaggedCount++;
            } else {
                finding.setOutcome(FindingOutcome.REQUIRES_HUMAN_REVIEW);
                finding.setTitle("Inspection Criterion Pending Review");
                finding.setDescription(crit.getDescription());
                flaggedCount++;
            }

            findings.add(finding);
        }

        // Determine Overall Assessment Status
        AssessmentStatus overallStatus;
        if (failedCount > 0) {
            overallStatus = AssessmentStatus.FAIL;
        } else if (flaggedCount > 0) {
            overallStatus = AssessmentStatus.REQUIRES_HUMAN_REVIEW;
        } else if (passedCount > 0) {
            // Note: Even if all evaluated criteria passed, Rule 1 dictates human approval is still required!
            overallStatus = AssessmentStatus.PASS;
        } else {
            overallStatus = AssessmentStatus.INCONCLUSIVE;
        }

        assessment.setStatus(overallStatus);
        assessment.setTotalCriteriaEvaluated(criteria.size());
        assessment.setPassedCriteriaCount(passedCount);
        assessment.setFlaggedCriteriaCount(flaggedCount);
        assessment.setFailedCriteriaCount(failedCount);
        assessment.setFindingsCount(findings.size());
        assessment.setEvaluationSummary(String.format(
                "AI Quality Assessment evaluated %d criteria (%d passed, %d flagged/requiring physical measurement, %d failed). Evidence completeness: %.1f%%. Authoritative human review mandatory.",
                criteria.size(), passedCount, flaggedCount, failedCount, completenessScore
        ));

        assessment = assessmentRepository.save(assessment);
        for (QualityAssessmentFinding f : findings) {
            f.setAssessment(assessment);
        }
        findingRepository.saveAll(findings);
        assessment.setFindings(findings);

        // Auto-create or ensure human inspection review queue item
        try {
            humanReviewService.ensureReviewForAssessment(assessment);
        } catch (Exception e) {
            log.warn("Could not auto-enqueue human review for assessment {}: {}", assessment.getAssessmentCode(), e.getMessage());
        }

        auditService.logEvent(
                currentUser,
                "QUALITY_ASSESSMENT_GENERATED",
                "QualityAssessment",
                assessment.getId(),
                "Generated quality assessment: code=" + assessment.getAssessmentCode() +
                        ", status=" + assessment.getStatus() +
                        ", assignment=" + assignment.getAssignmentCode(),
                null
        );

        return QualityAssessmentResponse.fromEntity(assessment);
    }

    @Transactional(readOnly = true)
    public QualityAssessmentResponse getAssessmentById(String assessmentId) {
        QualityAssessment qa = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QualityAssessment not found: " + assessmentId));
        return QualityAssessmentResponse.fromEntity(qa);
    }

    @Transactional(readOnly = true)
    public List<QualityAssessmentResponse> getAssignmentAssessments(String assignmentId) {
        List<QualityAssessment> list = assessmentRepository.findByAssignmentIdOrderByCreatedAtDesc(assignmentId);
        return list.stream().map(QualityAssessmentResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QualityTemplateDto> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(QualityTemplateDto::fromEntity)
                .collect(Collectors.toList());
    }
}
