package com.infrapulse.modules.humanreview.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.humanreview.dto.*;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.entity.CorrectiveActionEvidence;
import com.infrapulse.modules.humanreview.model.CorrectiveActionStatus;
import com.infrapulse.modules.humanreview.model.ReviewPriority;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionEvidenceRepository;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.model.FindingOutcome;
import com.infrapulse.modules.quality.repository.QualityAssessmentFindingRepository;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CorrectiveActionService {

    private static final Logger log = LoggerFactory.getLogger(CorrectiveActionService.class);

    private final CorrectiveActionRepository correctiveActionRepository;
    private final CorrectiveActionEvidenceRepository correctiveActionEvidenceRepository;
    private final QualityAssessmentRepository assessmentRepository;
    private final QualityAssessmentFindingRepository findingRepository;
    private final WorkEvidenceRepository evidenceRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public CorrectiveActionService(
            CorrectiveActionRepository correctiveActionRepository,
            CorrectiveActionEvidenceRepository correctiveActionEvidenceRepository,
            QualityAssessmentRepository assessmentRepository,
            QualityAssessmentFindingRepository findingRepository,
            WorkEvidenceRepository evidenceRepository,
            VendorRepository vendorRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.correctiveActionRepository = correctiveActionRepository;
        this.correctiveActionEvidenceRepository = correctiveActionEvidenceRepository;
        this.assessmentRepository = assessmentRepository;
        this.findingRepository = findingRepository;
        this.evidenceRepository = evidenceRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public CorrectiveActionDto createCorrectiveAction(
            String assessmentId,
            CreateCorrectiveActionRequest request,
            User currentUser) {

        // Rule: Vendors cannot create corrective actions
        if (currentUser.getRole() == UserRole.VENDOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vendors are not permitted to create corrective actions");
        }

        QualityAssessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QualityAssessment not found: " + assessmentId));

        WorkAssignment assignment = assessment.getAssignment();
        if (assignment == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assessment is not linked to any WorkAssignment");
        }

        QualityAssessmentFinding finding = null;
        if (request.getFindingId() != null && !request.getFindingId().isBlank()) {
            finding = findingRepository.findById(request.getFindingId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Finding not found: " + request.getFindingId()));
        }

        Long seq = correctiveActionRepository.getNextActionSequence();
        String code = "CA-" + String.format("%05d", seq);

        CorrectiveAction ca = new CorrectiveAction();
        ca.setActionCode(code);
        ca.setAssessment(assessment);
        ca.setAssignment(assignment);
        ca.setFinding(finding);
        ca.setVendor(assignment.getVendor());
        ca.setActionType(request.getActionType());
        ca.setDescription(request.getDescription());
        ca.setPriority(request.getPriority() != null ? request.getPriority() : ReviewPriority.MEDIUM);
        ca.setSeverity(request.getSeverity() != null ? request.getSeverity() : com.infrapulse.modules.quality.model.FindingSeverity.HIGH);
        ca.setStatus(CorrectiveActionStatus.OPEN);
        ca.setDueAt(request.getDueAt());
        ca.setCreatedBy(currentUser);

        ca = correctiveActionRepository.save(ca);

        auditService.logEvent(
                currentUser,
                "CORRECTIVE_ACTION_CREATED",
                "CorrectiveAction",
                ca.getId(),
                "Created corrective action " + code + " for assignment " + assignment.getAssignmentCode() +
                        ", vendor " + (assignment.getVendor() != null ? assignment.getVendor().getCompanyName() : "N/A"),
                null
        );

        return CorrectiveActionDto.fromEntity(ca);
    }

    @Transactional
    public CorrectiveActionDto submitReworkEvidence(
            String actionId,
            SubmitCorrectiveEvidenceRequest request,
            User currentUser) {

        CorrectiveAction ca = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CorrectiveAction not found: " + actionId));

        if (ca.getStatus() == CorrectiveActionStatus.CLOSED || ca.getStatus() == CorrectiveActionStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot submit evidence for closed or cancelled action");
        }

        // If current user is vendor, verify ownership
        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor ownVendor = vendorRepository.findByUserId(currentUser.getId()).orElse(null);
            if (ownVendor == null || ca.getVendor() == null ||
                    !ca.getVendor().getId().equals(ownVendor.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to submit evidence for this action");
            }
        }

        WorkEvidence evidence = evidenceRepository.findById(request.getEvidenceId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evidence not found: " + request.getEvidenceId()));

        CorrectiveActionEvidence cae = new CorrectiveActionEvidence();
        cae.setCorrectiveAction(ca);
        cae.setEvidence(evidence);
        cae.setSubmittedBy(currentUser);
        cae.setSubmissionType(request.getSubmissionType() != null ? request.getSubmissionType() : "REWORK_COMPLETION");
        cae.setRemarks(request.getRemarks());
        correctiveActionEvidenceRepository.save(cae);

        if (request.getVendorNotes() != null && !request.getVendorNotes().isBlank()) {
            ca.setVendorNotes((ca.getVendorNotes() != null ? ca.getVendorNotes() + "\n" : "") + request.getVendorNotes());
        }
        ca.setSubmittedAt(Instant.now());
        ca.setStatus(CorrectiveActionStatus.SUBMITTED_FOR_VERIFICATION);

        ca = correctiveActionRepository.save(ca);

        auditService.logEvent(
                currentUser,
                "CORRECTIVE_ACTION_EVIDENCE_SUBMITTED",
                "CorrectiveAction",
                ca.getId(),
                "Vendor submitted rework evidence " + evidence.getEvidenceCode() + " for action " + ca.getActionCode(),
                null
        );

        return CorrectiveActionDto.fromEntity(ca);
    }

    @Transactional
    public CorrectiveActionDto verifyCorrectiveAction(
            String actionId,
            VerifyCorrectiveActionRequest request,
            User currentUser) {

        // Rule: Vendors CANNOT verify or close corrective actions
        if (currentUser.getRole() == UserRole.VENDOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vendors are not permitted to verify or close corrective actions");
        }

        CorrectiveAction ca = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CorrectiveAction not found: " + actionId));

        ca.setReviewerRemarks((ca.getReviewerRemarks() != null ? ca.getReviewerRemarks() + "\n" : "") + request.getReviewerRemarks());
        ca.setVerifiedAt(Instant.now());
        ca.setAssignedInspector(currentUser);

        if (request.getStatus() == CorrectiveActionStatus.VERIFIED || request.getStatus() == CorrectiveActionStatus.CLOSED) {
            ca.setStatus(CorrectiveActionStatus.CLOSED);
            ca.setClosedAt(Instant.now());

            // If finding is linked, mark finding as resolved/pass
            if (ca.getFinding() != null) {
                QualityAssessmentFinding f = ca.getFinding();
                f.setOutcome(FindingOutcome.PASS);
                f.setDescription((f.getDescription() != null ? f.getDescription() + " | " : "") +
                        "Resolved via verified corrective action " + ca.getActionCode());
                findingRepository.save(f);
            }
        } else if (request.getStatus() == CorrectiveActionStatus.VERIFICATION_FAILED) {
            ca.setStatus(CorrectiveActionStatus.VERIFICATION_FAILED);
        } else {
            ca.setStatus(request.getStatus());
        }

        ca = correctiveActionRepository.save(ca);

        auditService.logEvent(
                currentUser,
                "CORRECTIVE_ACTION_VERIFIED",
                "CorrectiveAction",
                ca.getId(),
                "Corrective action " + ca.getActionCode() + " outcome: " + ca.getStatus() + " by " + currentUser.getFullName(),
                null
        );

        return CorrectiveActionDto.fromEntity(ca);
    }

    @Transactional
    public CorrectiveActionDto assignInspector(String actionId, String inspectorId, User currentUser) {
        if (currentUser.getRole() == UserRole.VENDOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vendors cannot assign corrective actions");
        }
        CorrectiveAction ca = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CorrectiveAction not found: " + actionId));
        User inspector = userRepository.findById(inspectorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Inspector user not found: " + inspectorId));
        ca.setAssignedInspector(inspector);
        ca = correctiveActionRepository.save(ca);
        auditService.logEvent(currentUser, "CORRECTIVE_ACTION_ASSIGNED", "CorrectiveAction", ca.getId(),
                "Assigned inspector " + inspector.getFullName() + " to action " + ca.getActionCode(), null);
        return CorrectiveActionDto.fromEntity(ca);
    }

    @Transactional
    public CorrectiveActionDto updateStatus(String actionId, CorrectiveActionStatus newStatus, String notes, User currentUser) {
        if (currentUser.getRole() == UserRole.VENDOR) {
            if (newStatus != CorrectiveActionStatus.IN_PROGRESS) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Vendors cannot modify corrective action status to " + newStatus);
            }
        }
        CorrectiveAction ca = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CorrectiveAction not found: " + actionId));
        ca.setStatus(newStatus);
        if (notes != null && !notes.isBlank()) {
            ca.setReviewerRemarks((ca.getReviewerRemarks() != null ? ca.getReviewerRemarks() + "\n" : "") + notes);
        }
        ca = correctiveActionRepository.save(ca);
        auditService.logEvent(currentUser, "CORRECTIVE_ACTION_STATUS_UPDATED", "CorrectiveAction", ca.getId(),
                "Updated status to " + newStatus + " for action " + ca.getActionCode(), null);
        return CorrectiveActionDto.fromEntity(ca);
    }

    @Transactional(readOnly = true)
    public CorrectiveActionDto getActionById(String actionId, User currentUser) {
        CorrectiveAction ca = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CorrectiveAction not found: " + actionId));

        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor ownVendor = vendorRepository.findByUserId(currentUser.getId()).orElse(null);
            if (ownVendor == null || ca.getVendor() == null ||
                    !ca.getVendor().getId().equals(ownVendor.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Access denied to corrective action");
            }
        }

        return CorrectiveActionDto.fromEntity(ca);
    }

    @Transactional(readOnly = true)
    public List<CorrectiveActionDto> getActionsForAssessment(String assessmentId) {
        return correctiveActionRepository.findByAssessmentIdOrderByCreatedAtDesc(assessmentId).stream()
                .map(CorrectiveActionDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CorrectiveActionDto> getVendorActions(String vendorId) {
        return correctiveActionRepository.findByVendorIdOrderByCreatedAtDesc(vendorId).stream()
                .map(CorrectiveActionDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CorrectiveActionDto> getFilteredActions(
            String vendorId,
            CorrectiveActionStatus status,
            ReviewPriority priority,
            String projectId,
            Pageable pageable) {

        return correctiveActionRepository.findFiltered(vendorId, status, priority, projectId, pageable)
                .map(CorrectiveActionDto::fromEntity);
    }
}
