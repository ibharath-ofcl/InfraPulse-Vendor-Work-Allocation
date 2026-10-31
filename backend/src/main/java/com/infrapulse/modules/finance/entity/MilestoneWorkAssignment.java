package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "milestone_work_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"milestone_id", "assignment_id"})
})
public class MilestoneWorkAssignment {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private ProjectMilestone milestone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public MilestoneWorkAssignment() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    public MilestoneWorkAssignment(ProjectMilestone milestone, WorkAssignment assignment) {
        this();
        this.milestone = milestone;
        this.assignment = assignment;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ProjectMilestone getMilestone() {
        return milestone;
    }

    public void setMilestone(ProjectMilestone milestone) {
        this.milestone = milestone;
    }

    public WorkAssignment getAssignment() {
        return assignment;
    }

    public void setAssignment(WorkAssignment assignment) {
        this.assignment = assignment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
