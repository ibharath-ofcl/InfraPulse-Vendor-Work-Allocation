package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workertrust.enums.SuspensionStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "worker_access_suspensions")
public class WorkerAccessSuspension {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imposed_by", nullable = false)
    private User imposedBy;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Column(name = "end_time")
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "suspension_status", length = 50, nullable = false)
    private SuspensionStatus suspensionStatus = SuspensionStatus.ACTIVE;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    public WorkerAccessSuspension() {
        this.id = UUID.randomUUID().toString();
        this.startTime = Instant.now();
        this.suspensionStatus = SuspensionStatus.ACTIVE;
    }

    public WorkerAccessSuspension(Worker worker, String reason, User imposedBy, LocalDate reviewDate) {
        this();
        this.worker = worker;
        this.reason = reason;
        this.imposedBy = imposedBy;
        this.reviewDate = reviewDate;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (startTime == null) startTime = Instant.now();
    }

    public boolean isActive() {
        return suspensionStatus == SuspensionStatus.ACTIVE && endTime == null;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getImposedBy() { return imposedBy; }
    public void setImposedBy(User imposedBy) { this.imposedBy = imposedBy; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public LocalDate getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDate reviewDate) { this.reviewDate = reviewDate; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public SuspensionStatus getSuspensionStatus() { return suspensionStatus; }
    public void setSuspensionStatus(SuspensionStatus suspensionStatus) { this.suspensionStatus = suspensionStatus; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}

