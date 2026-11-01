package com.infrapulse.modules.workertrust.service;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.BadRequestException;
import com.infrapulse.common.exception.ResourceNotFoundException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workertrust.dto.*;
import com.infrapulse.modules.workertrust.entity.*;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.repository.*;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import com.infrapulse.security.HashUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkerSiteAccessService {

    private static final Logger log = LoggerFactory.getLogger(WorkerSiteAccessService.class);

    private final WorkerRepository workerRepository;
    private final WorkerVendorAssociationRepository associationRepository;
    private final WorkerProjectAssignmentRepository assignmentRepository;
    private final WorkerCertificationRepository certificationRepository;
    private final WorkerQrCredentialRepository qrCredentialRepository;
    private final WorkerSiteAccessRepository siteAccessRepository;
    private final WorkerAccessSuspensionRepository suspensionRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final WorkerService workerService;
    private final AuditService auditService;

    public WorkerSiteAccessService(
        WorkerRepository workerRepository,
        WorkerVendorAssociationRepository associationRepository,
        WorkerProjectAssignmentRepository assignmentRepository,
        WorkerCertificationRepository certificationRepository,
        WorkerQrCredentialRepository qrCredentialRepository,
        WorkerSiteAccessRepository siteAccessRepository,
        WorkerAccessSuspensionRepository suspensionRepository,
        ProjectRepository projectRepository,
        WorkZoneRepository workZoneRepository,
        WorkerService workerService,
        AuditService auditService
    ) {
        this.workerRepository = workerRepository;
        this.associationRepository = associationRepository;
        this.assignmentRepository = assignmentRepository;
        this.certificationRepository = certificationRepository;
        this.qrCredentialRepository = qrCredentialRepository;
        this.siteAccessRepository = siteAccessRepository;
        this.suspensionRepository = suspensionRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.workerService = workerService;
        this.auditService = auditService;
    }

    @Transactional
    public WorkerQrBadgeResponse generateOrGetQrBadge(String workerId, User currentUser) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));

        if (worker.getCurrentStatus() != WorkerStatus.APPROVED &&
            worker.getCurrentStatus() != WorkerStatus.ASSIGNED &&
            worker.getCurrentStatus() != WorkerStatus.ACTIVE_ON_SITE) {
            throw new BadRequestException("Worker must be in APPROVED or ASSIGNED status to have an active QR badge. Current status: " + worker.getCurrentStatus());
        }

        if (suspensionRepository.existsByWorkerIdAndSuspensionStatus(worker.getId(), SuspensionStatus.ACTIVE)) {
            throw new BadRequestException("Cannot generate badge for SUSPENDED worker");
        }

        WorkerQrCredential credential = qrCredentialRepository
            .findFirstByWorkerIdAndCredentialStatusOrderByIssuedAtDesc(worker.getId(), CredentialStatus.ACTIVE)
            .filter(WorkerQrCredential::isValid)
            .orElseGet(() -> {
                String opaqueToken = "WRK-SEC-" + UUID.randomUUID().toString().replace("-", "") + "-" + HashUtil.generateSecureRandomToken(16);
                String tokenHash = HashUtil.sha256(opaqueToken);
                String payload = "INFRAPULSE:WRK:" + opaqueToken + ":" + worker.getWorkerCode();
                WorkerQrCredential cred = new WorkerQrCredential(
                    worker,
                    tokenHash,
                    payload,
                    Instant.now().plus(180, ChronoUnit.DAYS),
                    currentUser
                );
                return qrCredentialRepository.save(cred);
            });

        WorkerSummaryResponse summary = workerService.toSummaryResponse(worker);

        return new WorkerQrBadgeResponse(
            credential.getId(),
            worker.getId(),
            worker.getWorkerCode(),
            worker.getFullName(),
            worker.getJobRole(),
            worker.getPhotoReference(),
            summary.vendorName(),
            summary.vendorCode(),
            summary.activeProjectName(),
            summary.activeWorkZoneName(),
            credential.getTokenHash(),
            credential.getCredentialPayload(),
            credential.getCredentialStatus(),
            credential.getIssuedAt(),
            credential.getExpiresAt(),
            credential.isValid()
        );
    }

    @Transactional
    public SiteAccessScanResult checkIn(SiteCheckInRequest request, User recordingOfficer) {
        log.info("Processing site check-in attempt for identifier={} on project={}", request.tokenOrWorkerCode(), request.projectId());

        String input = request.tokenOrWorkerCode().trim();
        Worker worker = resolveWorkerFromInput(input);

        Project project = projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.projectId()));

        WorkZone workZone = null;
        if (request.workZoneId() != null && !request.workZoneId().isBlank()) {
            workZone = workZoneRepository.findById(request.workZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Work Zone not found with ID: " + request.workZoneId()));
        }

        if (worker == null) {
            recordSiteAccess(null, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.INVALID_OR_REVOKED_QR.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.INVALID_OR_REVOKED_QR, "Invalid or unrecognized Worker QR credential / Worker ID", null, project, workZone);
        }

        Optional<WorkerVendorAssociation> assocOpt = associationRepository.findFirstByWorkerIdAndAssociationStatus(worker.getId(), "ACTIVE");
        String vendorName = assocOpt.map(a -> a.getVendor().getCompanyName()).orElse("Unassigned");

        // Rule 1: Suspension Check
        if (suspensionRepository.existsByWorkerIdAndSuspensionStatus(worker.getId(), SuspensionStatus.ACTIVE)) {
            recordSiteAccess(worker, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.WORKER_SUSPENDED.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.WORKER_SUSPENDED,
                "Worker site access is currently SUSPENDED due to an active safety or compliance hold", worker, project, workZone);
        }

        // Rule 2: Approval Status Check
        if (worker.getCurrentStatus() != WorkerStatus.APPROVED &&
            worker.getCurrentStatus() != WorkerStatus.ASSIGNED &&
            worker.getCurrentStatus() != WorkerStatus.ACTIVE_ON_SITE) {
            recordSiteAccess(worker, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.WORKER_NOT_APPROVED.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.WORKER_NOT_APPROVED,
                "Worker has not been APPROVED by a Project Manager. Current status: " + worker.getCurrentStatus(), worker, project, workZone);
        }

        // Rule 3: Active Project Assignment Check
        Optional<WorkerProjectAssignment> assignmentOpt = assignmentRepository.findActiveAssignmentForWorkerAndProject(
            worker.getId(), project.getId(), LocalDate.now()
        );

        if (assignmentOpt.isEmpty()) {
            recordSiteAccess(worker, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.NO_ACTIVE_ASSIGNMENT.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.NO_ACTIVE_ASSIGNMENT,
                "Worker does not have an active authorized assignment on Project: " + project.getProjectName(), worker, project, workZone);
        }

        WorkerProjectAssignment assignment = assignmentOpt.get();
        if (workZone == null) {
            workZone = assignment.getWorkZone();
        } else if (!workZone.getId().equals(assignment.getWorkZone().getId())) {
            recordSiteAccess(worker, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.WRONG_WORK_ZONE.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.WRONG_WORK_ZONE,
                "Worker is assigned to Zone " + assignment.getWorkZone().getZoneCode() + " (" + assignment.getWorkZone().getZoneName() + "), but attempted entry at Zone " + workZone.getZoneCode(), worker, project, workZone);
        }

        // Rule 4: Mandatory Safety Certification Expiry Check
        List<WorkerCertification> certs = certificationRepository.findByWorkerId(worker.getId());
        boolean hasExpiredMandatory = certs.stream().anyMatch(c ->
            c.getVerificationStatus() == CertificationStatus.VERIFIED && c.isExpired()
        );
        if (hasExpiredMandatory) {
            recordSiteAccess(worker, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.CERTIFICATION_EXPIRED.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.CERTIFICATION_EXPIRED,
                "Worker possesses one or more EXPIRED mandatory safety certifications. Recertification required before site entry.", worker, project, workZone);
        }

        // Rule 5: Duplicate Check-In Prevention
        Optional<WorkerSiteAccess> openSessionOpt = siteAccessRepository.findFirstByWorkerIdAndExitTimeIsNullAndAccessStatus(
            worker.getId(), SiteAccessStatus.ALLOW_ENTRY
        );
        if (openSessionOpt.isPresent()) {
            recordSiteAccess(worker, project, workZone, SiteAccessStatus.BLOCK_ENTRY, recordingOfficer,
                SiteBlockingReason.ALREADY_CHECKED_IN.name(), request.deviceReference());
            return buildBlockedResult(SiteBlockingReason.ALREADY_CHECKED_IN,
                "Worker is already checked in on-site (Active session since " + openSessionOpt.get().getEntryTime() + "). Check out previous session first.", worker, project, workZone);
        }

        // All checks passed: Record Site Entry
        WorkerSiteAccess access = new WorkerSiteAccess(
            worker,
            project,
            workZone,
            Instant.now(),
            SiteAccessStatus.ALLOW_ENTRY,
            recordingOfficer,
            null
        );
        access.setDeviceReference(request.deviceReference());
        WorkerSiteAccess savedAccess = siteAccessRepository.save(access);

        worker.setCurrentStatus(WorkerStatus.ACTIVE_ON_SITE);
        workerRepository.save(worker);

        auditService.recordEvent(
            recordingOfficer.getId(),
            "WORKER_SITE_ENTRY_ALLOWED",
            "SITE_ACCESS",
            worker.getId(),
            String.format("Site entry ALLOWED for worker %s (%s) at Project %s / Zone %s",
                worker.getWorkerCode(), worker.getFullName(), project.getProjectCode(), workZone.getZoneCode()),
            "GATE_ENTRY"
        );

        return new SiteAccessScanResult(
            true,
            SiteAccessStatus.ALLOW_ENTRY,
            null,
            "Access Granted: Worker identity, active project allocation, and safety certifications verified.",
            savedAccess.getId(),
            worker.getId(),
            worker.getWorkerCode(),
            worker.getFullName(),
            worker.getJobRole(),
            vendorName,
            project.getId(),
            project.getProjectName(),
            workZone.getId(),
            workZone.getZoneName(),
            worker.getPhotoReference(),
            savedAccess.getEntryTime()
        );
    }

    @Transactional
    public SiteAccessScanResult checkOut(SiteCheckOutRequest request, User recordingOfficer) {
        String input = request.identifier().trim();
        WorkerSiteAccess activeAccess = null;

        Optional<WorkerSiteAccess> byId = siteAccessRepository.findById(input);
        if (byId.isPresent()) {
            activeAccess = byId.get();
        } else {
            Worker worker = resolveWorkerFromInput(input);
            if (worker != null) {
                activeAccess = siteAccessRepository.findFirstByWorkerIdAndExitTimeIsNullAndAccessStatus(
                    worker.getId(), SiteAccessStatus.ALLOW_ENTRY
                ).orElse(null);
            }
        }

        if (activeAccess == null || activeAccess.getExitTime() != null) {
            throw new BadRequestException("No active on-site check-in session found for identifier: " + input);
        }

        activeAccess.setExitTime(Instant.now());
        WorkerSiteAccess updated = siteAccessRepository.save(activeAccess);

        Worker worker = activeAccess.getWorker();
        boolean hasAssignment = assignmentRepository.findActiveAssignmentForWorker(worker.getId(), LocalDate.now()).isPresent();
        worker.setCurrentStatus(hasAssignment ? WorkerStatus.ASSIGNED : WorkerStatus.APPROVED);
        workerRepository.save(worker);

        auditService.recordEvent(
            recordingOfficer.getId(),
            "WORKER_SITE_EXIT_RECORDED",
            "SITE_ACCESS",
            worker.getId(),
            String.format("Site exit recorded for worker %s (%s) at Project %s",
                worker.getWorkerCode(), worker.getFullName(),
                activeAccess.getProject() != null ? activeAccess.getProject().getProjectCode() : "N/A"),
            "GATE_EXIT"
        );

        Optional<WorkerVendorAssociation> assocOpt = associationRepository.findFirstByWorkerIdAndAssociationStatus(worker.getId(), "ACTIVE");
        String vendorName = assocOpt.map(a -> a.getVendor().getCompanyName()).orElse("Unassigned");

        return new SiteAccessScanResult(
            true,
            SiteAccessStatus.ALLOW_ENTRY,
            null,
            "Check-out successful. Site exit timestamp recorded.",
            updated.getId(),
            worker.getId(),
            worker.getWorkerCode(),
            worker.getFullName(),
            worker.getJobRole(),
            vendorName,
            activeAccess.getProject() != null ? activeAccess.getProject().getId() : null,
            activeAccess.getProject() != null ? activeAccess.getProject().getProjectName() : null,
            activeAccess.getWorkZone() != null ? activeAccess.getWorkZone().getId() : null,
            activeAccess.getWorkZone() != null ? activeAccess.getWorkZone().getZoneName() : null,
            worker.getPhotoReference(),
            updated.getExitTime()
        );
    }

    @Transactional(readOnly = true)
    public EmergencyHeadcountResponse getEmergencyHeadcount(String projectId, String workZoneId, User currentUser) {
        List<WorkerSiteAccess> onSite = siteAccessRepository.findCurrentlyOnSiteByProjectAndZone(projectId, workZoneId);

        Map<String, Long> byProject = onSite.stream()
            .filter(sa -> sa.getProject() != null)
            .collect(Collectors.groupingBy(sa -> sa.getProject().getProjectName(), Collectors.counting()));

        Map<String, Long> byZone = onSite.stream()
            .filter(sa -> sa.getWorkZone() != null)
            .collect(Collectors.groupingBy(sa -> sa.getWorkZone().getZoneName(), Collectors.counting()));

        Map<String, Long> byVendor = new HashMap<>();
        for (WorkerSiteAccess sa : onSite) {
            String vName = associationRepository.findFirstByWorkerIdAndAssociationStatus(sa.getWorker().getId(), "ACTIVE")
                .map(a -> a.getVendor().getCompanyName())
                .orElse("Independent / Unassigned");
            byVendor.put(vName, byVendor.getOrDefault(vName, 0L) + 1L);
        }

        List<WorkerSiteAccessDto> personnel = onSite.stream()
            .map(workerService::toSiteAccessDto)
            .toList();

        auditService.recordEvent(
            currentUser.getId(),
            "EMERGENCY_HEADCOUNT_VIEWED",
            "SITE_ACCESS",
            projectId != null ? projectId : "SYSTEM",
            "Emergency headcount requested. Total active personnel: " + onSite.size(),
            "EMERGENCY_HEADCOUNT"
        );

        return new EmergencyHeadcountResponse(
            onSite.size(),
            byProject,
            byZone,
            byVendor,
            personnel,
            Instant.now()
        );
    }

    @Transactional(readOnly = true)
    public Page<WorkerSiteAccessDto> getAttendanceHistory(String vendorId, int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size);
        if (currentUser.getRole() == UserRole.VENDOR) {
            Vendor vendor = associationRepository.findAll().stream()
                .filter(a -> a.getVendor().getUser() != null && a.getVendor().getUser().getId().equals(currentUser.getId()))
                .map(WorkerVendorAssociation::getVendor)
                .findFirst()
                .orElse(null);
            if (vendor != null) {
                return siteAccessRepository.findByVendorId(vendor.getId(), pageable).map(workerService::toSiteAccessDto);
            }
        } else if (vendorId != null && !vendorId.isBlank()) {
            return siteAccessRepository.findByVendorId(vendorId, pageable).map(workerService::toSiteAccessDto);
        }

        return siteAccessRepository.findAll(pageable).map(workerService::toSiteAccessDto);
    }

    private Worker resolveWorkerFromInput(String input) {
        if (input.startsWith("INFRAPULSE:WRK:")) {
            String[] parts = input.split(":");
            if (parts.length >= 4) {
                String token = parts[2];
                String workerCode = parts[3];
                String tokenHash = HashUtil.sha256(token);
                Optional<WorkerQrCredential> cred = qrCredentialRepository.findByTokenHash(tokenHash);
                if (cred.isPresent() && cred.get().isValid()) {
                    return cred.get().getWorker();
                }
                return workerRepository.findByWorkerCode(workerCode).orElse(null);
            }
        }

        String hash = HashUtil.sha256(input);
        Optional<WorkerQrCredential> cred = qrCredentialRepository.findByTokenHash(hash);
        if (cred.isPresent() && cred.get().isValid()) {
            return cred.get().getWorker();
        }

        Optional<Worker> byCode = workerRepository.findByWorkerCode(input);
        if (byCode.isPresent()) {
            return byCode.get();
        }

        return workerRepository.findById(input).orElse(null);
    }

    private void recordSiteAccess(
        Worker worker,
        Project project,
        WorkZone workZone,
        SiteAccessStatus status,
        User officer,
        String reason,
        String deviceRef
    ) {
        if (worker == null) return;
        WorkerSiteAccess sa = new WorkerSiteAccess(
            worker,
            project,
            workZone,
            Instant.now(),
            status,
            officer,
            reason
        );
        sa.setDeviceReference(deviceRef);
        siteAccessRepository.save(sa);
    }

    private SiteAccessScanResult buildBlockedResult(
        SiteBlockingReason reason,
        String humanReason,
        Worker worker,
        Project project,
        WorkZone workZone
    ) {
        String vendorName = "Unknown";
        if (worker != null) {
            vendorName = associationRepository.findFirstByWorkerIdAndAssociationStatus(worker.getId(), "ACTIVE")
                .map(a -> a.getVendor().getCompanyName())
                .orElse("Unassigned");
        }

        return new SiteAccessScanResult(
            false,
            SiteAccessStatus.BLOCK_ENTRY,
            reason,
            humanReason,
            null,
            worker != null ? worker.getId() : null,
            worker != null ? worker.getWorkerCode() : "N/A",
            worker != null ? worker.getFullName() : "Unverified Worker",
            worker != null ? worker.getJobRole() : "N/A",
            vendorName,
            project != null ? project.getId() : null,
            project != null ? project.getProjectName() : null,
            workZone != null ? workZone.getId() : null,
            workZone != null ? workZone.getZoneName() : null,
            worker != null ? worker.getPhotoReference() : null,
            Instant.now()
        );
    }
}
