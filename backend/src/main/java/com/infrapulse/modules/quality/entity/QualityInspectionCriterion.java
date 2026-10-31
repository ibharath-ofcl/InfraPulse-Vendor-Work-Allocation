package com.infrapulse.modules.quality.entity;

import com.infrapulse.modules.quality.model.CriterionCategory;
import com.infrapulse.modules.quality.model.FindingSeverity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quality_inspection_criteria")
public class QualityInspectionCriterion {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private QualityInspectionTemplate template;

    @Column(name = "criterion_code", length = 50, nullable = false)
    private String criterionCode;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 64, nullable = false)
    private CriterionCategory category;

    @Column(name = "is_mandatory", nullable = false)
    private boolean isMandatory = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 32, nullable = false)
    private FindingSeverity severity = FindingSeverity.HIGH;

    @Column(name = "target_detection_class", length = 64)
    private String targetDetectionClass;

    @Column(name = "evaluation_rule_json", columnDefinition = "TEXT")
    private String evaluationRuleJson;

    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public QualityInspectionCriterion() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public QualityInspectionTemplate getTemplate() { return template; }
    public void setTemplate(QualityInspectionTemplate template) { this.template = template; }

    public String getCriterionCode() { return criterionCode; }
    public void setCriterionCode(String criterionCode) { this.criterionCode = criterionCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public CriterionCategory getCategory() { return category; }
    public void setCategory(CriterionCategory category) { this.category = category; }

    public boolean isMandatory() { return isMandatory; }
    public void setMandatory(boolean mandatory) { isMandatory = mandatory; }

    public FindingSeverity getSeverity() { return severity; }
    public void setSeverity(FindingSeverity severity) { this.severity = severity; }

    public String getTargetDetectionClass() { return targetDetectionClass; }
    public void setTargetDetectionClass(String targetDetectionClass) { this.targetDetectionClass = targetDetectionClass; }

    public String getEvaluationRuleJson() { return evaluationRuleJson; }
    public void setEvaluationRuleJson(String evaluationRuleJson) { this.evaluationRuleJson = evaluationRuleJson; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
