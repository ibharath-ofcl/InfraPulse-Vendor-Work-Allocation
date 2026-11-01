package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workertrust.enums.IncidentSeverity;
import com.infrapulse.modules.workertrust.enums.IncidentStatus;
import com.infrapulse.modules.workertrust.enums.IncidentType;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_incidents")
public class WorkerIncident {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "incident_reference", length = 50, nullable = false, unique = true)
    private String incidentReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id")
    private WorkZone workZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private Worker worker;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", length = 100, nullable = false)
    private IncidentType incidentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 50, nullable = false)
    private IncidentSeverity severity;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "immediate_action_taken", columnDefinition = "TEXT")
    private String immediateActionTaken;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_status", length = 50, nullable = false)
    private IncidentStatus incidentStatus = IncidentStatus.REPORTED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_investigator_id")
    private User assignedInvestigator;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "reported_at", nullable = false)
    private Instant reportedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public WorkerIncident() {
        this.id = UUID.randomUUID().toString();
        this.reportedAt = Instant.now();
        this.incidentStatus = IncidentStatus.REPORTED;
    }

    public WorkerIncident(String incidentReference, Project project, WorkZone workZone, Worker worker,
                          IncidentType incidentType, IncidentSeverity severity, String description, User reportedBy) {
        this();
        this.incidentReference = incidentReference;
        this.project = project;
        this.workZone = workZone;
        this.worker = worker;
        this.incidentType = incidentType;
        this.severity = severity;
        this.description = description;
        this.reportedBy = reportedBy;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (reportedAt == null) reportedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIncidentReference() { return incidentReference; }
    public void setIncidentReference(String incidentReference) { this.incidentReference = incidentReference; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public IncidentType getIncidentType() { return incidentType; }
    public void setIncidentType(IncidentType incidentType) { this.incidentType = incidentType; }

    public IncidentSeverity getSeverity() { return severity; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImmediateActionTaken() { return immediateActionTaken; }
    public void setImmediateActionTaken(String immediateActionTaken) { this.immediateActionTaken = immediateActionTaken; }

    public IncidentStatus getIncidentStatus() { return incidentStatus; }
    public void setIncidentStatus(IncidentStatus incidentStatus) { this.incidentStatus = incidentStatus; }

    public User getReportedBy() { return reportedBy; }
    public void setReportedBy(User reportedBy) { this.reportedBy = reportedBy; }

    public User getAssignedInvestigator() { return assignedInvestigator; }
    public void setAssignedInvestigator(User assignedInvestigator) { this.assignedInvestigator = assignedInvestigator; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
