package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workertrust.enums.AssignmentStatus;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "worker_project_assignments")
public class WorkerProjectAssignment {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id", nullable = false)
    private WorkZone workZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_status", length = 50, nullable = false)
    private AssignmentStatus assignmentStatus = AssignmentStatus.ACTIVE;

    @Column(name = "required_role", length = 100)
    private String requiredRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public WorkerProjectAssignment() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.assignmentStatus = AssignmentStatus.ACTIVE;
    }

    public WorkerProjectAssignment(Worker worker, Project project, WorkZone workZone, Vendor vendor,
                                   LocalDate startDate, LocalDate endDate, String requiredRole, User assignedBy) {
        this();
        this.worker = worker;
        this.project = project;
        this.workZone = workZone;
        this.vendor = vendor;
        this.startDate = startDate;
        this.endDate = endDate;
        this.requiredRole = requiredRole;
        this.assignedBy = assignedBy;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public boolean isActiveOn(LocalDate date) {
        return assignmentStatus == AssignmentStatus.ACTIVE &&
               !date.isBefore(startDate) &&
               !date.isAfter(endDate);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public AssignmentStatus getAssignmentStatus() { return assignmentStatus; }
    public void setAssignmentStatus(AssignmentStatus assignmentStatus) { this.assignmentStatus = assignmentStatus; }

    public String getRequiredRole() { return requiredRole; }
    public void setRequiredRole(String requiredRole) { this.requiredRole = requiredRole; }

    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

