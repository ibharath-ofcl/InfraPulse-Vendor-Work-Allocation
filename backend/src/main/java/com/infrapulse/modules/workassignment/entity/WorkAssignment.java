package com.infrapulse.modules.workassignment.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workassignment.enums.AssignmentPriority;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "work_assignments")
public class WorkAssignment {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "assignment_code", length = 50, nullable = false, unique = true)
    private String assignmentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id", nullable = false)
    private WorkZone workZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", length = 64, nullable = false)
    private WorkType workType;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "planned_start_date", nullable = false)
    private LocalDate plannedStartDate;

    @Column(name = "target_end_date", nullable = false)
    private LocalDate targetEndDate;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 32, nullable = false)
    private AssignmentPriority priority = AssignmentPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "release_status", length = 32, nullable = false)
    private ReleaseStatus releaseStatus = ReleaseStatus.PENDING_RELEASE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "released_by")
    private User releasedBy;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "release_notes", columnDefinition = "TEXT")
    private String releaseNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public WorkAssignment() {
    }

    public WorkAssignment(
        String id,
        String assignmentCode,
        Project project,
        WorkZone workZone,
        Vendor vendor,
        WorkType workType,
        String title,
        String description,
        LocalDate plannedStartDate,
        LocalDate targetEndDate,
        AssignmentPriority priority,
        AssignmentStatus status,
        String instructions,
        User createdBy
    ) {
        this.id = id;
        this.assignmentCode = assignmentCode;
        this.project = project;
        this.workZone = workZone;
        this.vendor = vendor;
        this.workType = workType;
        this.title = title;
        this.description = description;
        this.plannedStartDate = plannedStartDate;
        this.targetEndDate = targetEndDate;
        this.priority = priority != null ? priority : AssignmentPriority.MEDIUM;
        this.status = status != null ? status : AssignmentStatus.ASSIGNED;
        this.instructions = instructions;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAssignmentCode() {
        return assignmentCode;
    }

    public void setAssignmentCode(String assignmentCode) {
        this.assignmentCode = assignmentCode;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public WorkZone getWorkZone() {
        return workZone;
    }

    public void setWorkZone(WorkZone workZone) {
        this.workZone = workZone;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public WorkType getWorkType() {
        return workType;
    }

    public void setWorkType(WorkType workType) {
        this.workType = workType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getPlannedStartDate() {
        return plannedStartDate;
    }

    public void setPlannedStartDate(LocalDate plannedStartDate) {
        this.plannedStartDate = plannedStartDate;
    }

    public LocalDate getTargetEndDate() {
        return targetEndDate;
    }

    public void setTargetEndDate(LocalDate targetEndDate) {
        this.targetEndDate = targetEndDate;
    }

    public LocalDate getActualStartDate() {
        return actualStartDate;
    }

    public void setActualStartDate(LocalDate actualStartDate) {
        this.actualStartDate = actualStartDate;
    }

    public LocalDate getActualEndDate() {
        return actualEndDate;
    }

    public void setActualEndDate(LocalDate actualEndDate) {
        this.actualEndDate = actualEndDate;
    }

    public AssignmentPriority getPriority() {
        return priority;
    }

    public void setPriority(AssignmentPriority priority) {
        this.priority = priority;
    }

    public AssignmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssignmentStatus status) {
        this.status = status;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public ReleaseStatus getReleaseStatus() {
        return releaseStatus;
    }

    public void setReleaseStatus(ReleaseStatus releaseStatus) {
        this.releaseStatus = releaseStatus;
    }

    public User getReleasedBy() {
        return releasedBy;
    }

    public void setReleasedBy(User releasedBy) {
        this.releasedBy = releasedBy;
    }

    public Instant getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(Instant releasedAt) {
        this.releasedAt = releasedAt;
    }

    public String getReleaseNotes() {
        return releaseNotes;
    }

    public void setReleaseNotes(String releaseNotes) {
        this.releaseNotes = releaseNotes;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WorkAssignment that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
