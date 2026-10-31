package com.infrapulse.modules.humanreview.service;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ApiException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.dto.PhysicalMeasurementDto;
import com.infrapulse.modules.humanreview.dto.RecordMeasurementRequest;
import com.infrapulse.modules.humanreview.dto.VerifyMeasurementRequest;
import com.infrapulse.modules.humanreview.entity.PhysicalMeasurement;
import com.infrapulse.modules.humanreview.model.MeasurementVerificationStatus;
import com.infrapulse.modules.humanreview.repository.PhysicalMeasurementRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import com.infrapulse.modules.quality.model.FindingOutcome;
import com.infrapulse.modules.quality.repository.QualityAssessmentFindingRepository;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PhysicalMeasurementService {

    private static final Logger log = LoggerFactory.getLogger(PhysicalMeasurementService.class);

    private final PhysicalMeasurementRepository measurementRepository;
    private final QualityAssessmentRepository assessmentRepository;
    private final QualityAssessmentFindingRepository findingRepository;
    private final AuditService auditService;

    public PhysicalMeasurementService(
            PhysicalMeasurementRepository measurementRepository,
            QualityAssessmentRepository assessmentRepository,
            QualityAssessmentFindingRepository findingRepository,
            AuditService auditService) {
        this.measurementRepository = measurementRepository;
        this.assessmentRepository = assessmentRepository;
        this.findingRepository = findingRepository;
        this.auditService = auditService;
    }

    @Transactional
    public PhysicalMeasurementDto recordMeasurement(
            String assessmentId,
            RecordMeasurementRequest request,
            User inspector) {

        QualityAssessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QualityAssessment not found: " + assessmentId));

        QualityAssessmentFinding finding = null;
        if (request.getFindingId() != null && !request.getFindingId().isBlank()) {
            finding = findingRepository.findById(request.getFindingId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Finding not found: " + request.getFindingId()));
        }

        Long seq = measurementRepository.getNextMeasurementSequence();
        String code = "PM-" + String.format("%05d", seq);

        PhysicalMeasurement pm = new PhysicalMeasurement();
        pm.setMeasurementCode(code);
        pm.setAssessment(assessment);
        pm.setFinding(finding);
        pm.setMeasurementType(request.getMeasurementType());
        pm.setMeasuredValue(request.getMeasuredValue());
        pm.setUnit(request.getUnit());
        pm.setMeasurementMethod(request.getMeasurementMethod());
        pm.setInstrumentReference(request.getInstrumentReference());
        pm.setCalibrationReference(request.getCalibrationReference());
        pm.setInspector(inspector);
        pm.setSpecificationReference(request.getSpecificationReference());
        pm.setSpecificationVersion(request.getSpecificationVersion());
        pm.setMinAcceptableValue(request.getMinAcceptableValue());
        pm.setMaxAcceptableValue(request.getMaxAcceptableValue());
        pm.setRemarks(request.getRemarks());
        pm.setMeasuredAt(request.getMeasuredAt() != null ? request.getMeasuredAt() : Instant.now());

        // Verification logic
        if (request.getSpecificationReference() == null || request.getSpecificationReference().isBlank()
                || (request.getMinAcceptableValue() == null && request.getMaxAcceptableValue() == null)) {
            // Per requirements: If specification is missing, flag as SPECIFICATION_REQUIRED - never auto-pass
            pm.setVerificationStatus(MeasurementVerificationStatus.SPECIFICATION_REQUIRED);
        } else {
            boolean pass = true;
            if (request.getMinAcceptableValue() != null && request.getMeasuredValue() < request.getMinAcceptableValue()) {
                pass = false;
            }
            if (request.getMaxAcceptableValue() != null && request.getMeasuredValue() > request.getMaxAcceptableValue()) {
                pass = false;
            }
            pm.setVerificationStatus(pass ? MeasurementVerificationStatus.VERIFIED_PASS : MeasurementVerificationStatus.VERIFIED_FAIL);
        }

        pm = measurementRepository.save(pm);

        // If finding was waiting for physical measurement and verification passed, update finding
        if (finding != null && pm.getVerificationStatus() == MeasurementVerificationStatus.VERIFIED_PASS) {
            if (finding.getOutcome() == FindingOutcome.REQUIRES_PHYSICAL_MEASUREMENT || finding.getOutcome() == FindingOutcome.INCONCLUSIVE) {
                finding.setOutcome(FindingOutcome.PASS);
                finding.setDescription((finding.getDescription() != null ? finding.getDescription() + " | " : "") +
                        "Verified by physical measurement " + code + " (" + pm.getMeasuredValue() + " " + pm.getUnit() + ")");
                findingRepository.save(finding);
            }
        }

        auditService.logEvent(
                inspector,
                "PHYSICAL_MEASUREMENT_RECORDED",
                "PhysicalMeasurement",
                pm.getId(),
                "Recorded measurement " + code + " for assessment " + assessment.getAssessmentCode() +
                        ": " + pm.getMeasuredValue() + " " + pm.getUnit() + " (" + pm.getVerificationStatus() + ")",
                null
        );

        return PhysicalMeasurementDto.fromEntity(pm);
    }

    @Transactional
    public PhysicalMeasurementDto verifyMeasurement(
            String measurementId,
            VerifyMeasurementRequest request,
            User inspector) {

        PhysicalMeasurement pm = measurementRepository.findById(measurementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PhysicalMeasurement not found: " + measurementId));

        pm.setVerificationStatus(request.getVerificationStatus());
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            pm.setRemarks((pm.getRemarks() != null ? pm.getRemarks() + " | " : "") + request.getRemarks());
        }

        pm = measurementRepository.save(pm);

        if (pm.getFinding() != null && request.getVerificationStatus() == MeasurementVerificationStatus.VERIFIED_PASS) {
            QualityAssessmentFinding f = pm.getFinding();
            f.setOutcome(FindingOutcome.PASS);
            f.setDescription((f.getDescription() != null ? f.getDescription() + " | " : "") +
                    "Manually verified pass by inspector " + inspector.getFullName());
            findingRepository.save(f);
        }

        auditService.logEvent(
                inspector,
                "PHYSICAL_MEASUREMENT_VERIFIED",
                "PhysicalMeasurement",
                pm.getId(),
                "Measurement " + pm.getMeasurementCode() + " status updated to " + request.getVerificationStatus(),
                null
        );

        return PhysicalMeasurementDto.fromEntity(pm);
    }

    @Transactional(readOnly = true)
    public List<PhysicalMeasurementDto> getMeasurementsForAssessment(String assessmentId) {
        return measurementRepository.findByAssessmentIdOrderByMeasuredAtDesc(assessmentId).stream()
                .map(PhysicalMeasurementDto::fromEntity)
                .collect(Collectors.toList());
    }
}
