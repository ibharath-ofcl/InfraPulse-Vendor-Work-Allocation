package com.infrapulse.modules.quality.entity;

import com.infrapulse.modules.workassignment.enums.WorkType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quality_inspection_templates")
public class QualityInspectionTemplate {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "template_code", length = 50, nullable = false, unique = true)
    private String templateCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", length = 64, nullable = false)
    private WorkType workType;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "version", length = 32, nullable = false)
    private String version = "1.0.0";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "contract_reference", length = 128)
    private String contractReference;

    @Column(name = "effective_start_date")
    private java.time.LocalDate effectiveStartDate;

    @Column(name = "effective_end_date")
    private java.time.LocalDate effectiveEndDate;

    @Column(name = "passing_score_threshold", precision = 5, scale = 2, nullable = false)
    private java.math.BigDecimal passingScoreThreshold = new java.math.BigDecimal("85.00");

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<QualityInspectionCriterion> criteria = new ArrayList<>();

    public QualityInspectionTemplate() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }

    public WorkType getWorkType() { return workType; }
    public void setWorkType(WorkType workType) { this.workType = workType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContractReference() { return contractReference; }
    public void setContractReference(String contractReference) { this.contractReference = contractReference; }

    public java.time.LocalDate getEffectiveStartDate() { return effectiveStartDate; }
    public void setEffectiveStartDate(java.time.LocalDate effectiveStartDate) { this.effectiveStartDate = effectiveStartDate; }

    public java.time.LocalDate getEffectiveEndDate() { return effectiveEndDate; }
    public void setEffectiveEndDate(java.time.LocalDate effectiveEndDate) { this.effectiveEndDate = effectiveEndDate; }

    public java.math.BigDecimal getPassingScoreThreshold() { return passingScoreThreshold; }
    public void setPassingScoreThreshold(java.math.BigDecimal passingScoreThreshold) {
        this.passingScoreThreshold = passingScoreThreshold != null ? passingScoreThreshold : new java.math.BigDecimal("85.00");
    }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<QualityInspectionCriterion> getCriteria() { return criteria; }
    public void setCriteria(List<QualityInspectionCriterion> criteria) { this.criteria = criteria; }
}
