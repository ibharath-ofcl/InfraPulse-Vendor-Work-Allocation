package com.infrapulse.modules.intelligence.risk.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskCategory;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_risk_alerts")
public class ProjectRiskAlert {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id")
    private ProjectRiskAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id")
    private WorkZone workZone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_assignment_id")
    private WorkAssignment workAssignment;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_category", nullable = false, length = 64)
    private RiskCategory riskCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 32)
    private RiskLevel riskLevel = RiskLevel.MEDIUM;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "problem_statement", columnDefinition = "TEXT", nullable = false)
    private String problemStatement;

    @Column(name = "supporting_evidence_data", columnDefinition = "TEXT", nullable = false)
    private String supportingEvidenceData;

    @Column(name = "root_cause_reason", columnDefinition = "TEXT", nullable = false)
    private String rootCauseReason;

    @Column(name = "operational_impact", columnDefinition = "TEXT", nullable = false)
    private String operationalImpact;

    @Column(name = "recommended_action", columnDefinition = "TEXT", nullable = false)
    private String recommendedAction;

    @Column(name = "missing_data_notes", columnDefinition = "TEXT")
    private String missingDataNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_status", nullable = false, length = 32)
    private RiskAlertStatus alertStatus = RiskAlertStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ProjectRiskAlert() {
        this.id = UUID.randomUUID().toString();
    }

    public ProjectRiskAlert(Project project, RiskCategory riskCategory, RiskLevel riskLevel, String title, String problemStatement, String supportingEvidenceData, String rootCauseReason, String operationalImpact, String recommendedAction) {
        this();
        this.project = project;
        this.riskCategory = riskCategory;
        this.riskLevel = riskLevel != null ? riskLevel : RiskLevel.MEDIUM;
        this.title = title;
        this.problemStatement = problemStatement;
        this.supportingEvidenceData = supportingEvidenceData;
        this.rootCauseReason = rootCauseReason;
        this.operationalImpact = operationalImpact;
        this.recommendedAction = recommendedAction;
        this.alertStatus = RiskAlertStatus.ACTIVE;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ProjectRiskAssessment getAssessment() { return assessment; }
    public void setAssessment(ProjectRiskAssessment assessment) { this.assessment = assessment; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }

    public WorkAssignment getWorkAssignment() { return workAssignment; }
    public void setWorkAssignment(WorkAssignment workAssignment) { this.workAssignment = workAssignment; }

    public RiskCategory getRiskCategory() { return riskCategory; }
    public void setRiskCategory(RiskCategory riskCategory) { this.riskCategory = riskCategory; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getProblemStatement() { return problemStatement; }
    public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }

    public String getSupportingEvidenceData() { return supportingEvidenceData; }
    public void setSupportingEvidenceData(String supportingEvidenceData) { this.supportingEvidenceData = supportingEvidenceData; }

    public String getRootCauseReason() { return rootCauseReason; }
    public void setRootCauseReason(String rootCauseReason) { this.rootCauseReason = rootCauseReason; }

    public String getOperationalImpact() { return operationalImpact; }
    public void setOperationalImpact(String operationalImpact) { this.operationalImpact = operationalImpact; }

    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }

    public String getMissingDataNotes() { return missingDataNotes; }
    public void setMissingDataNotes(String missingDataNotes) { this.missingDataNotes = missingDataNotes; }

    public RiskAlertStatus getAlertStatus() { return alertStatus; }
    public void setAlertStatus(RiskAlertStatus alertStatus) { this.alertStatus = alertStatus; }

    public User getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(User resolvedBy) { this.resolvedBy = resolvedBy; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

