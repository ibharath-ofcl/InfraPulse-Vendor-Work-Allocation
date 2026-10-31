package com.infrapulse.modules.workdependency.entity;

import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "work_type_dependencies")
public class WorkTypeDependency {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "predecessor_work_type", length = 64, nullable = false)
    private WorkType predecessorWorkType;

    @Enumerated(EnumType.STRING)
    @Column(name = "successor_work_type", length = 64, nullable = false)
    private WorkType successorWorkType;

    @Enumerated(EnumType.STRING)
    @Column(name = "required_predecessor_status", length = 32, nullable = false)
    private AssignmentStatus requiredPredecessorStatus = AssignmentStatus.COMPLETED;

    @Column(name = "requires_release_approval", nullable = false)
    private boolean requiresReleaseApproval = true;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "priority", nullable = false)
    private int priority = 1;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public WorkTypeDependency() {
    }

    public WorkTypeDependency(
        String id,
        Project project,
        WorkType predecessorWorkType,
        WorkType successorWorkType,
        AssignmentStatus requiredPredecessorStatus,
        boolean requiresReleaseApproval,
        boolean isActive,
        int priority,
        String description
    ) {
        this.id = id;
        this.project = project;
        this.predecessorWorkType = predecessorWorkType;
        this.successorWorkType = successorWorkType;
        this.requiredPredecessorStatus = requiredPredecessorStatus != null ? requiredPredecessorStatus : AssignmentStatus.COMPLETED;
        this.requiresReleaseApproval = requiresReleaseApproval;
        this.isActive = isActive;
        this.priority = priority;
        this.description = description;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public WorkType getPredecessorWorkType() {
        return predecessorWorkType;
    }

    public void setPredecessorWorkType(WorkType predecessorWorkType) {
        this.predecessorWorkType = predecessorWorkType;
    }

    public WorkType getSuccessorWorkType() {
        return successorWorkType;
    }

    public void setSuccessorWorkType(WorkType successorWorkType) {
        this.successorWorkType = successorWorkType;
    }

    public AssignmentStatus getRequiredPredecessorStatus() {
        return requiredPredecessorStatus;
    }

    public void setRequiredPredecessorStatus(AssignmentStatus requiredPredecessorStatus) {
        this.requiredPredecessorStatus = requiredPredecessorStatus;
    }

    public boolean isRequiresReleaseApproval() {
        return requiresReleaseApproval;
    }

    public void setRequiresReleaseApproval(boolean requiresReleaseApproval) {
        this.requiresReleaseApproval = requiresReleaseApproval;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
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
        if (!(o instanceof WorkTypeDependency that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
