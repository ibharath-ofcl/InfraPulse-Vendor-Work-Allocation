package com.infrapulse.modules.intelligence.defect.service;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.repository.WorkEvidenceRepository;
import com.infrapulse.modules.intelligence.defect.dto.*;
import com.infrapulse.modules.intelligence.defect.entity.DefectHistoryEvent;
import com.infrapulse.modules.intelligence.defect.entity.DefectSimilarityCandidate;
import com.infrapulse.modules.intelligence.defect.entity.InfrastructureDefect;
import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import com.infrapulse.modules.intelligence.defect.repository.DefectHistoryEventRepository;
import com.infrapulse.modules.intelligence.defect.repository.DefectSimilarityCandidateRepository;
import com.infrapulse.modules.intelligence.defect.repository.InfrastructureDefectRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class DefectIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(DefectIntelligenceService.class);

    private final InfrastructureDefectRepository defectRepository;
    private final DefectSimilarityCandidateRepository candidateRepository;
    private final DefectHistoryEventRepository historyRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final VendorRepository vendorRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final WorkEvidenceRepository workEvidenceRepository;
    private final DefectRecurrenceClient recurrenceClient;

    public DefectIntelligenceService(
            InfrastructureDefectRepository defectRepository,
            DefectSimilarityCandidateRepository candidateRepository,
            DefectHistoryEventRepository historyRepository,
            ProjectRepository projectRepository,
            WorkZoneRepository workZoneRepository,
            VendorRepository vendorRepository,
            WorkAssignmentRepository workAssignmentRepository,
            WorkEvidenceRepository workEvidenceRepository,
            DefectRecurrenceClient recurrenceClient) {
        this.defectRepository = defectRepository;
        this.candidateRepository = candidateRepository;
        this.historyRepository = historyRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.vendorRepository = vendorRepository;
        this.workAssignmentRepository = workAssignmentRepository;
        this.workEvidenceRepository = workEvidenceRepository;
        this.recurrenceClient = recurrenceClient;
    }

    public DefectDto createDefect(CreateDefectRequest req, User actor) {
        Project project = projectRepository.findById(req.projectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + req.projectId()));

        WorkZone zone = null;
        if (req.workZoneId() != null) {
            zone = workZoneRepository.findById(req.workZoneId()).orElse(null);
        }

        Vendor vendor = null;
        if (req.vendorId() != null) {
            vendor = vendorRepository.findById(req.vendorId()).orElse(null);
        }

        WorkAssignment assignment = null;
        if (req.assignmentId() != null) {
            assignment = workAssignmentRepository.findById(req.assignmentId()).orElse(null);
            if (assignment != null) {
                if (zone == null && assignment.getWorkZone() != null) {
                    zone = assignment.getWorkZone();
                }
                if (vendor == null && assignment.getVendor() != null) {
                    vendor = assignment.getVendor();
                }
            }
        }

        WorkEvidence evidence = null;
        if (req.evidenceId() != null) {
            evidence = workEvidenceRepository.findById(req.evidenceId()).orElse(null);
            if (evidence != null && assignment == null && evidence.getWorkAssignment() != null) {
                assignment = evidence.getWorkAssignment();
                if (zone == null && assignment.getWorkZone() != null) {
                    zone = assignment.getWorkZone();
                }
                if (vendor == null && assignment.getVendor() != null) {
                    vendor = assignment.getVendor();
                }
            }
        }

        Long nextSeq = defectRepository.getNextDefectSeq();
        String defectCode = String.format("DEF-%05d", nextSeq != null ? nextSeq : System.currentTimeMillis() % 100000);

        InfrastructureDefect defect = new InfrastructureDefect(
                defectCode,
                project,
                zone,
                vendor,
                req.category(),
                req.severity() != null ? req.severity() : DefectSeverity.MEDIUM,
                req.description()
        );

        defect.setEvidence(evidence);
        defect.setAssignment(assignment);
        defect.setConfidence(req.confidence() != null ? req.confidence() : BigDecimal.valueOf(0.8500));
        defect.setBoundingBoxJson(req.boundingBoxJson());
        defect.setModelId(req.modelId() != null ? req.modelId() : "infrapulse-vision-v2");
        defect.setModelVersion(req.modelVersion() != null ? req.modelVersion() : "2.4.0");
        defect.setReviewedBy(actor);

        defect = defectRepository.save(defect);

        // Record history event
        DefectHistoryEvent event = new DefectHistoryEvent(
                defect,
                null,
                defect.getStatus().name(),
                "INITIAL_DETECTION",
                "Automated defect detection logged with confidence: " + defect.getConfidence(),
                actor,
                actor != null ? actor.getRole().name() : "SYSTEM"
        );
        historyRepository.save(event);

        // Run recurrence evaluation against previous defects in same project & category
        evaluateRecurrence(defect, evidence);

        return mapToDto(defect);
    }

    private void evaluateRecurrence(InfrastructureDefect defect, WorkEvidence evidence) {
        try {
            List<InfrastructureDefect> priorDefects = defectRepository.findPotentialRecurrenceCandidates(
                    defect.getProject().getId(),
                    defect.getCategory(),
                    defect.getId()
            );

            if (priorDefects.isEmpty()) {
                return;
            }

            Double refLat = null;
            Double refLon = null;
            if (evidence != null && evidence.getLatitude() != null && evidence.getLongitude() != null) {
                refLat = evidence.getLatitude().doubleValue();
                refLon = evidence.getLongitude().doubleValue();
            }

            List<DefectRecurrenceClient.CandidateInput> candidateInputs = new ArrayList<>();
            for (InfrastructureDefect prior : priorDefects) {
                Double pLat = null;
                Double pLon = null;
                if (prior.getEvidence() != null && prior.getEvidence().getLatitude() != null && prior.getEvidence().getLongitude() != null) {
                    pLat = prior.getEvidence().getLatitude().doubleValue();
                    pLon = prior.getEvidence().getLongitude().doubleValue();
                }
                int daysAgo = (int) Duration.between(prior.getInitialDetectedAt(), defect.getInitialDetectedAt()).toDays();
                candidateInputs.add(new DefectRecurrenceClient.CandidateInput(
                        prior.getId(),
                        prior.getCategory().name(),
                        pLat,
                        pLon,
                        Math.max(0, daysAgo)
                ));
            }

            List<DefectRecurrenceClient.RecurrenceResult> results = recurrenceClient.evaluateCandidates(
                    defect.getCategory().name(),
                    refLat,
                    refLon,
                    candidateInputs
            );

            boolean hasProbableRecurrence = false;
            String clusterId = defect.getRecurringClusterId();

            for (DefectRecurrenceClient.RecurrenceResult res : results) {
                InfrastructureDefect prior = defectRepository.findById(res.candidateId).orElse(null);
                if (prior == null) continue;

                DefectSimilarityCandidate candEntity = new DefectSimilarityCandidate(
                        defect,
                        prior,
                        res.similarityScore,
                        res.spatialDistanceMeters,
                        res.temporalDistanceDays,
                        res.comparisonBasis
                );

                if (res.isProbableRecurrence) {
                    candEntity.setHumanConfirmed(true);
                    hasProbableRecurrence = true;
                    if (clusterId == null) {
                        clusterId = prior.getRecurringClusterId() != null ? prior.getRecurringClusterId() : prior.getId();
                    }
                }
                candidateRepository.save(candEntity);
            }

            if (hasProbableRecurrence) {
                defect.setRecurring(true);
                defect.setRecurringClusterId(clusterId);
                defect.setRecurrenceCount(defect.getRecurrenceCount() + 1);
                defectRepository.save(defect);

                DefectHistoryEvent recEvent = new DefectHistoryEvent(
                        defect,
                        defect.getStatus().name(),
                        defect.getStatus().name(),
                        "RECURRENCE_ENGINE_MATCH",
                        "Probable recurring defect identified based on spatial and category recurrence engine.",
                        null,
                        "AI_ENGINE"
                );
                historyRepository.save(recEvent);
            }
        } catch (Exception e) {
            log.warn("Failed to evaluate defect recurrence for {}: {}", defect.getDefectCode(), e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<DefectDto> searchDefects(String projectId, String vendorId, DefectCategory category, DefectStatus status, Boolean recurring, Pageable pageable) {
        return defectRepository.searchDefects(projectId, vendorId, category, status, recurring, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public DefectDto getDefectById(String id) {
        InfrastructureDefect defect = defectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Defect not found: " + id));
        return mapToDto(defect);
    }

    @Transactional(readOnly = true)
    public List<DefectRecurrenceCandidateDto> getRecurrenceCandidates(String defectId) {
        return candidateRepository.findByDefectIdOrderBySimilarityScoreDesc(defectId).stream()
                .map(c -> new DefectRecurrenceCandidateDto(
                        c.getId(),
                        c.getCandidateDefect().getId(),
                        c.getCandidateDefect().getDefectCode(),
                        c.getCandidateDefect().getCategory().name(),
                        c.getCandidateDefect().getSeverity().name(),
                        c.getCandidateDefect().getStatus().name(),
                        c.getSimilarityScore(),
                        c.getSpatialDistanceMeters(),
                        c.getTemporalDistanceDays(),
                        c.getComparisonBasis(),
                        c.getHumanConfirmed(),
                        c.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public DefectDto updateDefectStatus(String defectId, DefectStatusUpdateRequest req, User actor) {
        InfrastructureDefect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new IllegalArgumentException("Defect not found: " + defectId));

        DefectStatus oldStatus = defect.getStatus();
        DefectStatus newStatus = req.newStatus();

        defect.setStatus(newStatus);
        defect.setReviewedBy(actor);
        defect.setReviewNotes(req.reviewNotes());

        if (newStatus == DefectStatus.RESOLVED && defect.getResolvedAt() == null) {
            defect.setResolvedAt(Instant.now());
        }

        defect = defectRepository.save(defect);

        DefectHistoryEvent event = new DefectHistoryEvent(
                defect,
                oldStatus.name(),
                newStatus.name(),
                req.actionTaken() != null ? req.actionTaken() : "LIFECYCLE_TRANSITION",
                req.reviewNotes() != null ? req.reviewNotes() : "Status updated to " + newStatus,
                actor,
                actor != null ? actor.getRole().name() : "USER"
        );
        historyRepository.save(event);

        return mapToDto(defect);
    }

    public void confirmRecurrence(String candidateId, boolean confirmed, User actor) {
        DefectSimilarityCandidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Recurrence candidate not found: " + candidateId));

        candidate.setHumanConfirmed(confirmed);
        candidateRepository.save(candidate);

        InfrastructureDefect defect = candidate.getDefect();
        if (confirmed) {
            defect.setRecurring(true);
            if (defect.getRecurringClusterId() == null) {
                defect.setRecurringClusterId(candidate.getCandidateDefect().getId());
            }
            defect.setRecurrenceCount(Math.max(defect.getRecurrenceCount(), 1));
            defectRepository.save(defect);

            DefectHistoryEvent event = new DefectHistoryEvent(
                    defect,
                    defect.getStatus().name(),
                    defect.getStatus().name(),
                    "HUMAN_RECURRENCE_CONFIRMATION",
                    "Human reviewer confirmed recurrence with defect: " + candidate.getCandidateDefect().getDefectCode(),
                    actor,
                    actor != null ? actor.getRole().name() : "REVIEWER"
            );
            historyRepository.save(event);
        }
    }

    @Transactional(readOnly = true)
    public DefectDashboardSummaryDto getDefectDashboardSummary(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        List<InfrastructureDefect> allDefects = defectRepository.findByProjectId(projectId);

        long total = allDefects.size();
        long open = allDefects.stream().filter(d -> d.getStatus() == DefectStatus.DETECTED || d.getStatus() == DefectStatus.UNDER_REVIEW).count();
        long confirmed = allDefects.stream().filter(d -> d.getStatus() == DefectStatus.CONFIRMED).count();
        long recurring = allDefects.stream().filter(InfrastructureDefect::isRecurring).count();
        long resolved = allDefects.stream().filter(d -> d.getStatus() == DefectStatus.RESOLVED).count();
        long correctivePending = allDefects.stream().filter(d -> d.getStatus() == DefectStatus.CORRECTIVE_ACTION_REQUIRED).count();

        double recurringPct = total > 0 ? (recurring * 100.0) / total : 0.0;
        recurringPct = BigDecimal.valueOf(recurringPct).setScale(1, RoundingMode.HALF_UP).doubleValue();

        Map<String, Long> byCategory = allDefects.stream()
                .collect(Collectors.groupingBy(d -> d.getCategory().name(), Collectors.counting()));

        Map<String, Long> bySeverity = allDefects.stream()
                .collect(Collectors.groupingBy(d -> d.getSeverity().name(), Collectors.counting()));

        Map<String, Long> byZone = allDefects.stream()
                .filter(d -> d.getWorkZone() != null)
                .collect(Collectors.groupingBy(d -> d.getWorkZone().getZoneName(), Collectors.counting()));

        return new DefectDashboardSummaryDto(
                project.getId(),
                project.getProjectName(),
                total,
                open,
                confirmed,
                recurring,
                resolved,
                correctivePending,
                recurringPct,
                byCategory,
                bySeverity,
                byZone
        );
    }

    @Transactional(readOnly = true)
    public VendorDefectScorecardDto getVendorDefectScorecard(String vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        List<InfrastructureDefect> vendorDefects = defectRepository.findAll().stream()
                .filter(d -> d.getVendor() != null && d.getVendor().getId().equals(vendorId))
                .collect(Collectors.toList());

        long totalReported = vendorDefects.size();
        long confirmed = vendorDefects.stream().filter(d -> d.getStatus() == DefectStatus.CONFIRMED || d.getStatus() == DefectStatus.CORRECTIVE_ACTION_REQUIRED || d.getStatus() == DefectStatus.RESOLVED).count();
        long recurringCount = vendorDefects.stream().filter(InfrastructureDefect::isRecurring).count();
        long resolved = vendorDefects.stream().filter(d -> d.getStatus() == DefectStatus.RESOLVED).count();

        double recurringRate = totalReported > 0 ? (recurringCount * 100.0) / totalReported : 0.0;
        recurringRate = BigDecimal.valueOf(recurringRate).setScale(1, RoundingMode.HALF_UP).doubleValue();

        // Calculate average resolution time in days
        double totalResolutionDays = 0.0;
        int resolvedCount = 0;
        for (InfrastructureDefect d : vendorDefects) {
            if (d.getResolvedAt() != null) {
                long hours = Duration.between(d.getInitialDetectedAt(), d.getResolvedAt()).toHours();
                totalResolutionDays += (hours / 24.0);
                resolvedCount++;
            }
        }
        double avgResolutionDays = resolvedCount > 0 ? BigDecimal.valueOf(totalResolutionDays / resolvedCount).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0;

        // Assignments and First-pass rate
        long totalAssignments = workAssignmentRepository.findByVendorId(vendorId).size();
        long totalInspections = Math.max(totalAssignments, totalReported);
        long firstPassApprovals = Math.max(0, totalInspections - totalReported);
        double firstPassRate = totalInspections > 0 ? (firstPassApprovals * 100.0) / totalInspections : 100.0;
        firstPassRate = BigDecimal.valueOf(firstPassRate).setScale(1, RoundingMode.HALF_UP).doubleValue();

        Map<String, Long> byCategory = vendorDefects.stream()
                .collect(Collectors.groupingBy(d -> d.getCategory().name(), Collectors.counting()));

        return new VendorDefectScorecardDto(
                vendor.getId(),
                vendor.getCompanyName(),
                totalAssignments,
                totalInspections,
                firstPassApprovals,
                firstPassRate,
                totalReported,
                confirmed,
                recurringCount,
                recurringRate,
                resolved,
                avgResolutionDays,
                byCategory
        );
    }

    private DefectDto mapToDto(InfrastructureDefect d) {
        String evidenceCode = d.getEvidence() != null ? d.getEvidence().getEvidenceCode() : null;
        String evidenceThumb = d.getEvidence() != null ? (d.getEvidence().getPreviewStorageKey() != null ? d.getEvidence().getPreviewStorageKey() : d.getEvidence().getStorageKey()) : null;
        String assignmentCode = d.getAssignment() != null ? d.getAssignment().getAssignmentCode() : null;
        String projectName = d.getProject() != null ? d.getProject().getProjectName() : null;
        String workZoneName = d.getWorkZone() != null ? d.getWorkZone().getZoneName() : null;
        String vendorName = d.getVendor() != null ? d.getVendor().getCompanyName() : null;
        String reviewerName = d.getReviewedBy() != null ? d.getReviewedBy().getFullName() : null;

        return new DefectDto(
                d.getId(),
                d.getDefectCode(),
                d.getEvidence() != null ? d.getEvidence().getId() : null,
                evidenceCode,
                evidenceThumb,
                d.getAssignment() != null ? d.getAssignment().getId() : null,
                assignmentCode,
                d.getProject().getId(),
                projectName,
                d.getWorkZone() != null ? d.getWorkZone().getId() : null,
                workZoneName,
                d.getVendor() != null ? d.getVendor().getId() : null,
                vendorName,
                d.getCategory(),
                d.getSeverity(),
                d.getStatus(),
                d.getConfidence(),
                d.getBoundingBoxJson(),
                d.getModelId(),
                d.getModelVersion(),
                d.getDescription(),
                d.isRecurring(),
                d.getRecurringClusterId(),
                d.getRecurrenceCount(),
                d.getInitialDetectedAt(),
                d.getResolvedAt(),
                d.getReviewedBy() != null ? d.getReviewedBy().getId() : null,
                reviewerName,
                d.getReviewNotes(),
                d.getCreatedAt()
        );
    }
}
