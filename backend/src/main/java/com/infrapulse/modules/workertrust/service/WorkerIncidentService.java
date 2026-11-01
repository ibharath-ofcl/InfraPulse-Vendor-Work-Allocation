package com.infrapulse.modules.workertrust.service;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.common.exception.ResourceNotFoundException;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.workertrust.dto.ReportIncidentRequest;
import com.infrapulse.modules.workertrust.dto.ResolveIncidentRequest;
import com.infrapulse.modules.workertrust.dto.WorkerIncidentDto;
import com.infrapulse.modules.workertrust.entity.Worker;
import com.infrapulse.modules.workertrust.entity.WorkerIncident;
import com.infrapulse.modules.workertrust.entity.WorkerNotification;
import com.infrapulse.modules.workertrust.enums.IncidentSeverity;
import com.infrapulse.modules.workertrust.enums.IncidentStatus;
import com.infrapulse.modules.workertrust.repository.WorkerIncidentRepository;
import com.infrapulse.modules.workertrust.repository.WorkerNotificationRepository;
import com.infrapulse.modules.workertrust.repository.WorkerRepository;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

@Service
public class WorkerIncidentService {

    private static final Logger log = LoggerFactory.getLogger(WorkerIncidentService.class);

    private final WorkerIncidentRepository incidentRepository;
    private final WorkerRepository workerRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final WorkerNotificationRepository notificationRepository;
    private final WorkerService workerService;
    private final AuditService auditService;

    public WorkerIncidentService(
        WorkerIncidentRepository incidentRepository,
        WorkerRepository workerRepository,
        ProjectRepository projectRepository,
        WorkZoneRepository workZoneRepository,
        WorkerNotificationRepository notificationRepository,
        WorkerService workerService,
        AuditService auditService
    ) {
        this.incidentRepository = incidentRepository;
        this.workerRepository = workerRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.notificationRepository = notificationRepository;
        this.workerService = workerService;
        this.auditService = auditService;
    }

    @Transactional
    public WorkerIncidentDto reportIncident(ReportIncidentRequest request, User reporter) {
        Long seq = incidentRepository.getNextIncidentSequence();
        int year = LocalDate.now().getYear();
        String ref = String.format("INC-%d-%04d", year, seq);

        Project project = null;
        if (request.projectId() != null && !request.projectId().isBlank()) {
            project = projectRepository.findById(request.projectId()).orElse(null);
        }

        WorkZone workZone = null;
        if (request.workZoneId() != null && !request.workZoneId().isBlank()) {
            workZone = workZoneRepository.findById(request.workZoneId()).orElse(null);
        }

        Worker worker = null;
        if (request.workerId() != null && !request.workerId().isBlank()) {
            worker = workerRepository.findById(request.workerId()).orElse(null);
        }

        WorkerIncident incident = new WorkerIncident(
            ref,
            project,
            workZone,
            worker,
            request.incidentType(),
            request.severity(),
            request.description().trim(),
            reporter
        );
        incident.setImmediateActionTaken(request.immediateActionTaken());
        incident.setIncidentStatus(IncidentStatus.REPORTED);
        WorkerIncident saved = incidentRepository.save(incident);

        if (project != null && project.getProjectManager() != null) {
            WorkerNotification notif = new WorkerNotification(
                project.getProjectManager(),
                "SAFETY_INCIDENT_REPORTED",
                String.format("Safety Incident [%s] (%s / %s) reported on Project %s: %s",
                    ref, request.incidentType(), request.severity(), project.getProjectCode(), request.description()),
                "INCIDENT",
                saved.getId()
            );
            notificationRepository.save(notif);
        }

        auditService.recordEvent(
            reporter.getId(),
            "SAFETY_INCIDENT_REPORTED",
            "WORKER_INCIDENT",
            saved.getId(),
            String.format("Incident %s reported with severity %s on Project %s",
                ref, request.severity(), project != null ? project.getProjectCode() : "N/A"),
            "SAFETY_INCIDENT"
        );

        return workerService.toIncidentDto(saved);
    }

    @Transactional
    public WorkerIncidentDto resolveIncident(String incidentId, ResolveIncidentRequest request, User investigator) {
        WorkerIncident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new ResourceNotFoundException("Incident not found with ID: " + incidentId));

        incident.setIncidentStatus(request.incidentStatus());
        incident.setResolution(request.resolution().trim());
        incident.setAssignedInvestigator(investigator);
        if (request.incidentStatus() == IncidentStatus.RESOLVED || request.incidentStatus() == IncidentStatus.CLOSED) {
            incident.setResolvedAt(Instant.now());
        }
        WorkerIncident updated = incidentRepository.save(incident);

        auditService.recordEvent(
            investigator.getId(),
            "SAFETY_INCIDENT_RESOLVED",
            "WORKER_INCIDENT",
            incident.getId(),
            String.format("Incident %s updated to status %s with resolution: %s",
                incident.getIncidentReference(), request.incidentStatus(), request.resolution()),
            "INCIDENT_RESOLUTION"
        );

        return workerService.toIncidentDto(updated);
    }

    @Transactional(readOnly = true)
    public Page<WorkerIncidentDto> listIncidents(
        IncidentStatus status,
        IncidentSeverity severity,
        String projectId,
        int page,
        int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return incidentRepository.findAllWithFilters(status, severity, projectId, pageable)
            .map(workerService::toIncidentDto);
    }
}
