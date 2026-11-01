package com.infrapulse.modules.intelligence.defect.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectSeverity;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "infrastructure_defects")
public class InfrastructureDefect {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "defect_code", unique = true, nullable = false, length = 64)
    private String defectCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private WorkEvidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private WorkAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id")
    private WorkZone workZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private DefectCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DefectSeverity severity = DefectSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DefectStatus status = DefectStatus.DETECTED;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(name = "bounding_box_json", columnDefinition = "TEXT")
    private String boundingBoxJson;

    @Column(name = "model_id", length = 64)
    private String modelId;

    @Column(name = "model_version", length = 32)
    private String modelVersion;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "is_recurring", nullable = false)
    private boolean recurring = false;

    @Column(name = "recurring_cluster_id", length = 36)
    private String recurringClusterId;

    @Column(name = "recurrence_count")
    private int recurrenceCount = 0;

    @Column(name = "initial_detected_at", nullable = false)
    private Instant initialDetectedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public InfrastructureDefect() {
        this.id = UUID.randomUUID().toString();
    }

    public InfrastructureDefect(String defectCode, Project project, WorkZone workZone, Vendor vendor, DefectCategory category, DefectSeverity severity, String description) {
        this();
        this.defectCode = defectCode;
        this.project = project;
        this.workZone = workZone;
        this.vendor = vendor;
        this.category = category;
        this.severity = severity != null ? severity : DefectSeverity.MEDIUM;
        this.description = description;
        this.status = DefectStatus.DETECTED;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDefectCode() { return defectCode; }
    public void setDefectCode(String defectCode) { this.defectCode = defectCode; }

    public WorkEvidence getEvidence() { return evidence; }
    public void setEvidence(WorkEvidence evidence) { this.evidence = evidence; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }

    public DefectCategory getCategory() { return category; }
    public void setCategory(DefectCategory category) { this.category = category; }

    public DefectSeverity getSeverity() { return severity; }
    public void setSeverity(DefectSeverity severity) { this.severity = severity; }

    public DefectStatus getStatus() { return status; }
    public void setStatus(DefectStatus status) { this.status = status; }

    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }

    public String getBoundingBoxJson() { return boundingBoxJson; }
    public void setBoundingBoxJson(String boundingBoxJson) { this.boundingBoxJson = boundingBoxJson; }

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isRecurring() { return recurring; }
    public void setRecurring(boolean recurring) { this.recurring = recurring; }

    public String getRecurringClusterId() { return recurringClusterId; }
    public void setRecurringClusterId(String recurringClusterId) { this.recurringClusterId = recurringClusterId; }

    public int getRecurrenceCount() { return recurrenceCount; }
    public void setRecurrenceCount(int recurrenceCount) { this.recurrenceCount = recurrenceCount; }

    public Instant getInitialDetectedAt() { return initialDetectedAt; }
    public void setInitialDetectedAt(Instant initialDetectedAt) { this.initialDetectedAt = initialDetectedAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
