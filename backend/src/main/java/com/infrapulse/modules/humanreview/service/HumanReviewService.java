package com.infrapulse.modules.humanreview.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.ai.entity.AiDetectionResult;
import com.infrapulse.modules.ai.entity.AiInferenceResult;
import com.infrapulse.modules.ai.repository.AiInferenceRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.humanreview.dto.*;
import com.infrapulse.modules.humanreview.entity.*;
import com.infrapulse.modules.humanreview.model.*;
import com.infrapulse.modules.humanreview.repository.*;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.model.AssessmentStatus;
import com.infrapulse.modules.quality.model.FindingOutcome;
import com.infrapulse.modules.quality.repository.QualityAssessmentFindingRepository;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HumanReviewService {

    private static final Logger log = LoggerFactory.getLogger(HumanReviewService.class);

    private final HumanInspectionReviewRepository reviewRepository;
    private final HumanInspectionDecisionRepository decisionRepository;
    private final PhysicalMeasurementRepository measurementRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final InspectionEscalationRepository escalationRepository;
    private final QualityAssessmentRepository assessmentRepository;
    private final QualityAssessmentFindingRepository findingRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final WorkEvidenceRepository evidenceRepository;
    private final AiInferenceRepository inferenceRepository;
    private final AuditService auditService;

    public HumanReviewService(
            HumanInspectionReviewRepository reviewRepository,
            HumanInspectionDecisionRepository decisionRepository,
            PhysicalMeasurementRepository measurementRepository,
            CorrectiveActionRepository correctiveActionRepository,
            InspectionEscalationRepository escalationRepository,
            QualityAssessmentRepository assessmentRepository,
            QualityAssessmentFindingRepository findingRepository,
            WorkAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            WorkEvidenceRepository evidenceRepository,
            AiInferenceRepository inferenceRepository,
            AuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.decisionRepository = decisionRepository;
        this.measurementRepository = measurementRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.escalationRepository = escalationRepository;
        this.assessmentRepository = assessmentRepository;
        this.findingRepository = findingRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.evidenceRepository = evidenceRepository;
        this.inferenceRepository = inferenceRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<HumanReviewSummaryDto> getReviewQueue(
            ReviewStatus status,
            ReviewPriority priority,
            String reviewerId,
            String projectId,
            String vendorId,
            Pageable pageable) {

        return reviewRepository.findFiltered(status, priority, reviewerId, projectId, vendorId, pageable)
                .map(review -> {
                    HumanReviewSummaryDto dto = HumanReviewSummaryDto.fromEntity(review);
                    if (review.getAssessment() != null) {
                        String aid = review.getAssessment().getId();
                        List<PhysicalMeasurement> pm = measurementRepository.findByAssessmentIdOrderByMeasuredAtDesc(aid);
                        int pendingMeas = (int) pm.stream().filter(m -> 
                                m.getVerificationStatus() == MeasurementVerificationStatus.PENDING || 
                                m.getVerificationStatus() == MeasurementVerificationStatus.SPECIFICATION_REQUIRED
                        ).count();
                        dto.setPendingMeasurementsCount(pendingMeas);

                        List<CorrectiveAction> ca = correctiveActionRepository.findByAssessmentIdOrderByCreatedAtDesc(aid);
                        int openCa = (int) ca.stream().filter(c -> 
                                c.getStatus() != CorrectiveActionStatus.CLOSED && 
                                c.getStatus() != CorrectiveActionStatus.CANCELLED
                        ).count();
                        dto.setOpenCorrectiveActionsCount(openCa);
                    }
                    var latestDec = decisionRepository.findFirstByReviewIdOrderByDecidedAtDesc(review.getId());
                    latestDec.ifPresent(d -> dto.setLatestDecision(d.getDecisionType()));
                    return dto;
                });
    }

    @Transactional(readOnly = true)
    public HumanReviewDetailDto getReviewDetail(String reviewId) {
        HumanInspectionReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "HumanInspectionReview not found: " + reviewId));

        HumanReviewDetailDto dto = HumanReviewDetailDto.fromEntity(review);

        if (review.getAssessment() != null) {
            String assessmentId = review.getAssessment().getId();

            List<PhysicalMeasurement> measurements = measurementRepository
                    .findByAssessmentIdOrderByMeasuredAtDesc(assessmentId);
            dto.setPhysicalMeasurements(measurements.stream()
                    .map(PhysicalMeasurementDto::fromEntity)
                    .collect(Collectors.toList()));

            List<CorrectiveAction> correctiveActions = correctiveActionRepository
                    .findByAssessmentIdOrderByCreatedAtDesc(assessmentId);
            dto.setCorrectiveActions(correctiveActions.stream()
                    .map(CorrectiveActionDto::fromEntity)
                    .collect(Collectors.toList()));
        }

        List<InspectionEscalation> escalations = escalationRepository.findByReviewIdOrderByCreatedAtDesc(review.getId());
        dto.setEscalations(escalations.stream()
                .map(InspectionEscalationDto::fromEntity)
                .collect(Collectors.toList()));

        List<HumanInspectionDecision> decisions = decisionRepository
                .findByReviewIdOrderByDecidedAtDesc(review.getId());
        dto.setDecisions(decisions.stream()
                .map(DecisionResponseDto::fromEntity)
                .collect(Collectors.toList()));
        if (!decisions.isEmpty()) {
            dto.setLatestDecision(decisions.get(0).getDecisionType());
        }

        // Section C: Populate real Evidence & AI Detection Overlays
        if (review.getAssignment() != null) {
            String assignmentId = review.getAssignment().getId();
            List<WorkEvidence> evidences = evidenceRepository.findByWorkAssignmentIdAndIsDeletedFalse(assignmentId);
            List<AiInferenceResult> inferences = inferenceRepository.findByAssignmentIdOrderByCreatedAtDesc(assignmentId);

            Map<String, AiInferenceResult> evidenceInferenceMap = new HashMap<>();
            for (AiInferenceResult inf : inferences) {
                if (inf.getEvidence() != null && !evidenceInferenceMap.containsKey(inf.getEvidence().getId())) {
                    evidenceInferenceMap.put(inf.getEvidence().getId(), inf);
                }
            }

            List<InspectionEvidenceItemDto> evidenceItems = new ArrayList<>();
            for (WorkEvidence e : evidences) {
                InspectionEvidenceItemDto item = new InspectionEvidenceItemDto();
                item.setId(e.getId());
                item.setEvidenceCode(e.getEvidenceCode());
                item.setEvidenceCategory(e.getEvidenceCategory() != null ? e.getEvidenceCategory().name() : "GENERAL");
                item.setFileName(e.getOriginalFileName());
                item.setFileSize(e.getFileSize());
                item.setMimeType(e.getMimeType());
                item.setPreviewUrl("/api/v1/evidence/" + e.getId() + "/preview");
                item.setFileUrl("/api/v1/evidence/" + e.getId() + "/file");
                item.setLatitude(e.getLatitude());
                item.setLongitude(e.getLongitude());
                item.setUploadedAt(e.getUploadedAt());
                item.setSubmittedByName(e.getUploadedBy() != null ? e.getUploadedBy().getFullName() : "Vendor Staff");
                item.setVendorName(review.getAssignment().getVendor() != null ? review.getAssignment().getVendor().getCompanyName() : "Vendor");

                AiInferenceResult inf = evidenceInferenceMap.get(e.getId());
                if (inf != null) {
                    item.setAiQualityStatus(inf.getImageQuality() != null ? inf.getImageQuality().getQualityStatus() : "ACCEPTED");
                    item.setAiClarityScore(inf.getImageQuality() != null ? inf.getImageQuality().getBlurScore() : 95.0);
                    item.setAiModelName(inf.getModelId());
                    item.setAiModelVersion(inf.getModelVersion());
                    if (inf.getDetections() != null) {
                        for (AiDetectionResult d : inf.getDetections()) {
                            item.getDetections().add(new InspectionDetectionDto(
                                    d.getId(),
                                    d.getClassId(),
                                    d.getClassLabel(),
                                    d.getConfidence(),
                                    d.getBoundingBoxJson()
                            ));
                        }
                    }
                }

                evidenceItems.add(item);
            }
            dto.setEvidenceList(evidenceItems);
        }

        return dto;
    }

    @Transactional
    public HumanReviewDetailDto getOrCreateReviewForAssessment(String assessmentId) {
        QualityAssessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QualityAssessment not found: " + assessmentId));

        HumanInspectionReview review = ensureReviewForAssessment(assessment);
        return getReviewDetail(review.getId());
    }

    @Transactional
    public HumanInspectionReview ensureReviewForAssessment(QualityAssessment assessment) {
        return reviewRepository.findByAssessmentId(assessment.getId()).orElseGet(() -> {
            Long seq = reviewRepository.getNextReviewSequence();
            String code = "HIR-" + String.format("%05d", seq);

            HumanInspectionReview r = new HumanInspectionReview();
            r.setReviewCode(code);
            r.setAssessment(assessment);
            r.setAssignment(assessment.getAssignment());
            r.setReviewStatus(ReviewStatus.PENDING);

            if (assessment.getFailedCriteriaCount() > 0) {
                r.setPriority(ReviewPriority.HIGH);
            } else if (assessment.getFlaggedCriteriaCount() > 0) {
                r.setPriority(ReviewPriority.MEDIUM);
            } else {
                r.setPriority(ReviewPriority.MEDIUM);
            }

            r = reviewRepository.save(r);
            log.info("Enqueued human review queue item: {} for assessment: {}", code, assessment.getAssessmentCode());
            return r;
        });
    }

    @Transactional
    public HumanReviewSummaryDto assignReviewer(String reviewId, String reviewerId, User currentUser) {
        if (currentUser.getRole() == UserRole.VENDOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vendors cannot assign reviews");
        }

        HumanInspectionReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Review not found: " + reviewId));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reviewer user not found: " + reviewerId));

        review.setReviewer(reviewer);
        review.setAssignedAt(Instant.now());
        if (review.getReviewStatus() == ReviewStatus.PENDING) {
            review.setReviewStatus(ReviewStatus.IN_REVIEW);
            review.setStartedAt(Instant.now());
        }

        review = reviewRepository.save(review);

        auditService.logEvent(
                currentUser,
                "HUMAN_REVIEW_ASSIGNED",
                "HumanInspectionReview",
                review.getId(),
                "Assigned reviewer " + reviewer.getFullName() + " to review " + review.getReviewCode(),
                null
        );

        return HumanReviewSummaryDto.fromEntity(review);
    }

    @Transactional
    public DecisionResponseDto recordDecision(String reviewId, RecordDecisionRequest request, User currentUser) {
        // Enforce role authorization
        if (currentUser.getRole() == UserRole.VENDOR || currentUser.getRole() == UserRole.FINANCE_OFFICER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User role " + currentUser.getRole() + " is not authorized to record inspection decisions");
        }

        HumanInspectionReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Review not found: " + reviewId));

        QualityAssessment assessment = review.getAssessment();
        WorkAssignment assignment = review.getAssignment();

        // Previous decision for audit chain
        HumanInspectionDecision previousDecision = decisionRepository
                .findFirstByReviewIdOrderByDecidedAtDesc(reviewId)
                .orElse(null);

        // Validation for APPROVED: Strict Rule 2 Compliance
        if (request.getDecisionType() == ReviewDecisionType.APPROVED) {
            validateApprovalPrerequisites(assessment);
        }

        // Record decision
        HumanInspectionDecision decision = new HumanInspectionDecision();
        decision.setReview(review);
        decision.setAssessment(assessment);
        decision.setAssignment(assignment);
        decision.setDecisionType(request.getDecisionType());
        decision.setReviewer(currentUser);
        decision.setReviewerRole(currentUser.getRole().name());
        decision.setReason(request.getReason());
        decision.setComments(request.getComments());
        decision.setPreviousDecision(previousDecision);
        decision.setDecidedAt(Instant.now());

        decision = decisionRepository.save(decision);

        // State transitions based on decision
        switch (request.getDecisionType()) {
            case APPROVED -> {
                review.setReviewStatus(ReviewStatus.COMPLETED);
                review.setCompletedAt(Instant.now());
                assessment.setStatus(AssessmentStatus.PASS);

                // Stage 6 Dependency Release Integration: Release assignment clearance
                assignment.setReleaseStatus(ReleaseStatus.RELEASED);
                assignment.setReleasedBy(currentUser);
                assignment.setReleasedAt(Instant.now());
                assignment.setReleaseNotes("Approved by human review " + review.getReviewCode() + ": " + request.getReason());
                if (assignment.getStatus() == AssignmentStatus.SUBMITTED_FOR_REVIEW || assignment.getStatus() == AssignmentStatus.IN_PROGRESS) {
                    assignment.setStatus(AssignmentStatus.COMPLETED);
                }
                assignmentRepository.save(assignment);
                assessmentRepository.save(assessment);

                auditService.logEvent(
                        currentUser,
                        "QUALITY_INSPECTION_APPROVED",
                        "HumanInspectionDecision",
                        decision.getId(),
                        "Approved inspection for " + assignment.getAssignmentCode() + ", releaseStatus set to RELEASED",
                        null
                );
            }
            case REJECTED -> {
                review.setReviewStatus(ReviewStatus.COMPLETED);
                review.setCompletedAt(Instant.now());

                assignment.setReleaseStatus(ReleaseStatus.REJECTED);
                assignment.setReleasedBy(currentUser);
                assignment.setReleasedAt(Instant.now());
                assignment.setReleaseNotes("Rejected in inspection review " + review.getReviewCode() + ": " + request.getReason());
                assignmentRepository.save(assignment);

                auditService.logEvent(
                        currentUser,
                        "QUALITY_INSPECTION_REJECTED",
                        "HumanInspectionDecision",
                        decision.getId(),
                        "Rejected inspection for " + assignment.getAssignmentCode() + ", work blocked",
                        null
                );
            }
            case REWORK_REQUIRED -> {
                review.setReviewStatus(ReviewStatus.IN_REVIEW);
                assignment.setReleaseStatus(ReleaseStatus.PENDING_RELEASE);
                assignmentRepository.save(assignment);

                auditService.logEvent(
                        currentUser,
                        "QUALITY_INSPECTION_REWORK_REQUIRED",
                        "HumanInspectionDecision",
                        decision.getId(),
                        "Rework required for " + assignment.getAssignmentCode(),
                        null
                );
            }
            case REQUEST_MORE_EVIDENCE -> {
                review.setReviewStatus(ReviewStatus.IN_REVIEW);
                auditService.logEvent(
                        currentUser,
                        "QUALITY_INSPECTION_MORE_EVIDENCE_REQUESTED",
                        "HumanInspectionDecision",
                        decision.getId(),
                        "More evidence requested for " + assignment.getAssignmentCode(),
                        null
                );
            }
            case NEEDS_PHYSICAL_INSPECTION -> {
                review.setReviewStatus(ReviewStatus.IN_REVIEW);
                review.setPriority(ReviewPriority.HIGH);
                auditService.logEvent(
                        currentUser,
                        "QUALITY_INSPECTION_NEEDS_PHYSICAL_MEASUREMENT",
                        "HumanInspectionDecision",
                        decision.getId(),
                        "Physical onsite inspection requested for " + assignment.getAssignmentCode(),
                        null
                );
            }
            case ESCALATED -> {
                review.setReviewStatus(ReviewStatus.ESCALATED);
                auditService.logEvent(
                        currentUser,
                        "QUALITY_INSPECTION_ESCALATED",
                        "HumanInspectionDecision",
                        decision.getId(),
                        "Inspection review escalated for " + assignment.getAssignmentCode(),
                        null
                );
            }
        }

        review = reviewRepository.save(review);
        return DecisionResponseDto.fromEntity(decision);
    }

    private void validateApprovalPrerequisites(QualityAssessment assessment) {
        List<QualityAssessmentFinding> findings = findingRepository.findByAssessmentIdOrderByCreatedAtAsc(assessment.getId());

        List<PhysicalMeasurement> measurements = measurementRepository
                .findByAssessmentIdOrderByMeasuredAtDesc(assessment.getId());

        List<CorrectiveAction> correctiveActions = correctiveActionRepository
                .findByAssessmentIdOrderByCreatedAtDesc(assessment.getId());

        for (QualityAssessmentFinding f : findings) {
            // If finding requires physical measurement
            if (f.getOutcome() == FindingOutcome.REQUIRES_PHYSICAL_MEASUREMENT) {
                boolean hasVerifiedPass = measurements.stream()
                        .anyMatch(m -> (m.getFinding() != null && m.getFinding().getId().equals(f.getId())
                                || m.getAssessment().getId().equals(assessment.getId()))
                                && m.getVerificationStatus() == MeasurementVerificationStatus.VERIFIED_PASS);

                if (!hasVerifiedPass) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            "Cannot approve inspection: criterion '" + f.getCriterionName() +
                                    "' requires physical measurement verification against engineering specifications.");
                }
            }

            // If finding failed
            if (f.getOutcome() == FindingOutcome.FAIL) {
                // Must be resolved by a verified closed corrective action
                boolean resolved = correctiveActions.stream()
                        .anyMatch(ca -> (ca.getFinding() != null && ca.getFinding().getId().equals(f.getId()))
                                && (ca.getStatus() == CorrectiveActionStatus.CLOSED || ca.getStatus() == CorrectiveActionStatus.VERIFIED));

                if (!resolved && f.getSeverity() == com.infrapulse.modules.quality.model.FindingSeverity.CRITICAL) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            "Cannot approve inspection: critical failure on '" + f.getCriterionName() +
                                    "' has not been resolved with a verified corrective action.");
                }
            }

            // If finding still requires human review
            if (f.getOutcome() == FindingOutcome.REQUIRES_HUMAN_REVIEW && f.getSeverity() == com.infrapulse.modules.quality.model.FindingSeverity.CRITICAL) {
                // If critical human review finding, require either a measurement or an explicit corrective action
                boolean hasResolution = correctiveActions.stream()
                        .anyMatch(ca -> ca.getStatus() == CorrectiveActionStatus.CLOSED || ca.getStatus() == CorrectiveActionStatus.VERIFIED);
                if (!hasResolution && measurements.isEmpty()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            "Cannot approve inspection: criterion '" + f.getCriterionName() +
                                    "' requires physical verification or resolution before approval.");
                }
            }
        }
    }

    @Transactional
    public InspectionEscalationDto escalateReview(String reviewId, CreateEscalationRequest request, User currentUser) {
        HumanInspectionReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Review not found: " + reviewId));

        User assignedReviewer = null;
        if (request.getAssignedReviewerId() != null && !request.getAssignedReviewerId().isBlank()) {
            assignedReviewer = userRepository.findById(request.getAssignedReviewerId()).orElse(null);
        }

        InspectionEscalation escalation = new InspectionEscalation();
        escalation.setAssessment(review.getAssessment());
        escalation.setReview(review);
        escalation.setEscalationReason(request.getEscalationReason());
        escalation.setSeverity(request.getSeverity() != null ? request.getSeverity() : "HIGH");
        escalation.setEscalatedBy(currentUser);
        escalation.setAssignedRole(request.getAssignedRole());
        escalation.setAssignedReviewer(assignedReviewer);
        escalation.setStatus("OPEN");

        escalation = escalationRepository.save(escalation);

        review.setReviewStatus(ReviewStatus.ESCALATED);
        review.setPriority(ReviewPriority.CRITICAL);
        reviewRepository.save(review);

        auditService.logEvent(
                currentUser,
                "REVIEW_ESCALATED",
                "InspectionEscalation",
                escalation.getId(),
                "Escalated review " + review.getReviewCode() + ": " + request.getEscalationReason(),
                null
        );

        return InspectionEscalationDto.fromEntity(escalation);
    }

    @Transactional(readOnly = true)
    public List<DecisionResponseDto> getReviewDecisions(String reviewId) {
        return decisionRepository.findByReviewIdOrderByDecidedAtDesc(reviewId).stream()
                .map(DecisionResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DecisionResponseDto> getAssessmentDecisions(String assessmentId) {
        return decisionRepository.findByAssessmentIdOrderByDecidedAtDesc(assessmentId).stream()
                .map(DecisionResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
