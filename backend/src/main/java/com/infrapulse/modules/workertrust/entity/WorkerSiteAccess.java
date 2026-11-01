package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workertrust.enums.SiteAccessStatus;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_site_access")
public class WorkerSiteAccess {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id")
    private WorkZone workZone;

    @Column(name = "entry_time", nullable = false)
    private Instant entryTime;

    @Column(name = "exit_time")
    private Instant exitTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_status", length = 50, nullable = false)
    private SiteAccessStatus accessStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recording_officer_id")
    private User recordingOfficer;

    @Column(name = "blocking_reason")
    private String blockingReason;

    @Column(name = "device_reference", length = 100)
    private String deviceReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public WorkerSiteAccess() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    public WorkerSiteAccess(Worker worker, Project project, WorkZone workZone, Instant entryTime,
                            SiteAccessStatus accessStatus, User recordingOfficer, String blockingReason) {
        this();
        this.worker = worker;
        this.project = project;
        this.workZone = workZone;
        this.entryTime = entryTime != null ? entryTime : Instant.now();
        this.accessStatus = accessStatus;
        this.recordingOfficer = recordingOfficer;
        this.blockingReason = blockingReason;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public boolean isCurrentlyOnSite() {
        return accessStatus == SiteAccessStatus.ALLOW_ENTRY && exitTime == null;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public Instant getEntryTime() { return entryTime; }
    public void setEntryTime(Instant entryTime) { this.entryTime = entryTime; }

    public Instant getExitTime() { return exitTime; }
    public void setExitTime(Instant exitTime) { this.exitTime = exitTime; }

    public SiteAccessStatus getAccessStatus() { return accessStatus; }
    public void setAccessStatus(SiteAccessStatus accessStatus) { this.accessStatus = accessStatus; }

    public User getRecordingOfficer() { return recordingOfficer; }
    public void setRecordingOfficer(User recordingOfficer) { this.recordingOfficer = recordingOfficer; }

    public String getBlockingReason() { return blockingReason; }
    public void setBlockingReason(String blockingReason) { this.blockingReason = blockingReason; }

    public String getDeviceReference() { return deviceReference; }
    public void setDeviceReference(String deviceReference) { this.deviceReference = deviceReference; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

