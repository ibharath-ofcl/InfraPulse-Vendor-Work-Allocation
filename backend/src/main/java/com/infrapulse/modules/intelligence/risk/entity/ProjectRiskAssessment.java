package com.infrapulse.modules.intelligence.risk.entity;

import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_risk_assessments")
public class ProjectRiskAssessment {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "assessment_code", unique = true, nullable = false, length = 64)
    private String assessmentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id")
    private WorkZone workZone;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_risk_level", nullable = false, length = 32)
    private RiskLevel overallRiskLevel = RiskLevel.LOW;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_risk_level", nullable = false, length = 32)
    private RiskLevel scheduleRiskLevel = RiskLevel.LOW;

    @Enumerated(EnumType.STRING)
    @Column(name = "vendor_risk_level", nullable = false, length = 32)
    private RiskLevel vendorRiskLevel = RiskLevel.LOW;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_risk_level", nullable = false, length = 32)
    private RiskLevel qualityRiskLevel = RiskLevel.LOW;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_risk_level", nullable = false, length = 32)
    private RiskLevel resourceRiskLevel = RiskLevel.LOW;

    @Enumerated(EnumType.STRING)
    @Column(name = "dependency_risk_level", nullable = false, length = 32)
    private RiskLevel dependencyRiskLevel = RiskLevel.LOW;

    @Column(name = "overall_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(name = "calculation_method", nullable = false, length = 64)
    private String calculationMethod = "DETERMINISTIC_RULES_V1";

    @Column(name = "evaluated_at", nullable = false)
    private Instant evaluatedAt = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ProjectRiskAssessment() {
        this.id = UUID.randomUUID().toString();
    }

    public ProjectRiskAssessment(String assessmentCode, Project project, WorkZone workZone, RiskLevel overallRiskLevel, BigDecimal overallScore) {
        this();
        this.assessmentCode = assessmentCode;
        this.project = project;
        this.workZone = workZone;
        this.overallRiskLevel = overallRiskLevel;
        this.overallScore = overallScore;
        this.evaluatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentCode() { return assessmentCode; }
    public void setAssessmentCode(String assessmentCode) { this.assessmentCode = assessmentCode; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public RiskLevel getOverallRiskLevel() { return overallRiskLevel; }
    public void setOverallRiskLevel(RiskLevel overallRiskLevel) { this.overallRiskLevel = overallRiskLevel; }

    public RiskLevel getScheduleRiskLevel() { return scheduleRiskLevel; }
    public void setScheduleRiskLevel(RiskLevel scheduleRiskLevel) { this.scheduleRiskLevel = scheduleRiskLevel; }

    public RiskLevel getVendorRiskLevel() { return vendorRiskLevel; }
    public void setVendorRiskLevel(RiskLevel vendorRiskLevel) { this.vendorRiskLevel = vendorRiskLevel; }

    public RiskLevel getQualityRiskLevel() { return qualityRiskLevel; }
    public void setQualityRiskLevel(RiskLevel qualityRiskLevel) { this.qualityRiskLevel = qualityRiskLevel; }

    public RiskLevel getResourceRiskLevel() { return resourceRiskLevel; }
    public void setResourceRiskLevel(RiskLevel resourceRiskLevel) { this.resourceRiskLevel = resourceRiskLevel; }

    public RiskLevel getDependencyRiskLevel() { return dependencyRiskLevel; }
    public void setDependencyRiskLevel(RiskLevel dependencyRiskLevel) { this.dependencyRiskLevel = dependencyRiskLevel; }

    public BigDecimal getOverallScore() { return overallScore; }
    public void setOverallScore(BigDecimal overallScore) { this.overallScore = overallScore; }

    public String getCalculationMethod() { return calculationMethod; }
    public void setCalculationMethod(String calculationMethod) { this.calculationMethod = calculationMethod; }

    public Instant getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(Instant evaluatedAt) { this.evaluatedAt = evaluatedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

