package com.infrapulse.modules.analytics.entity;

import com.infrapulse.modules.analytics.enums.DataSufficiencyStatus;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "vendor_performance_snapshots")
public class VendorPerformanceSnapshot {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scoring_configuration_id")
    private VendorScoringConfiguration scoringConfiguration;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "completion_rate", precision = 6, scale = 2)
    private BigDecimal completionRate;

    @Column(name = "on_time_rate", precision = 6, scale = 2)
    private BigDecimal onTimeRate;

    @Column(name = "quality_pass_rate", precision = 6, scale = 2)
    private BigDecimal qualityPassRate;

    @Column(name = "evidence_compliance_rate", precision = 6, scale = 2)
    private BigDecimal evidenceComplianceRate;

    @Column(name = "rework_rate", precision = 6, scale = 2)
    private BigDecimal reworkRate;

    @Column(name = "inspection_turnaround_hours", precision = 8, scale = 2)
    private BigDecimal inspectionTurnaroundHours;

    @Column(name = "corrective_action_resolution_hours", precision = 8, scale = 2)
    private BigDecimal correctiveActionResolutionHours;

    @Column(name = "workload_count")
    private Integer workloadCount = 0;

    @Column(name = "overall_score", precision = 6, scale = 2)
    private BigDecimal overallScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_sufficiency_status", length = 32, nullable = false)
    private DataSufficiencyStatus dataSufficiencyStatus = DataSufficiencyStatus.SUFFICIENT_DATA;

    @Column(name = "sample_counts", columnDefinition = "TEXT")
    private String sampleCounts;

    @Column(name = "calculated_at", nullable = false)
    private Instant calculatedAt;

    public VendorPerformanceSnapshot() {
        this.id = UUID.randomUUID().toString();
        this.calculatedAt = Instant.now();
    }

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.calculatedAt == null) this.calculatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public VendorScoringConfiguration getScoringConfiguration() {
        return scoringConfiguration;
    }

    public void setScoringConfiguration(VendorScoringConfiguration scoringConfiguration) {
        this.scoringConfiguration = scoringConfiguration;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(LocalDate periodStart) {
        this.periodStart = periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(LocalDate periodEnd) {
        this.periodEnd = periodEnd;
    }

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public BigDecimal getOnTimeRate() {
        return onTimeRate;
    }

    public void setOnTimeRate(BigDecimal onTimeRate) {
        this.onTimeRate = onTimeRate;
    }

    public BigDecimal getQualityPassRate() {
        return qualityPassRate;
    }

    public void setQualityPassRate(BigDecimal qualityPassRate) {
        this.qualityPassRate = qualityPassRate;
    }

    public BigDecimal getEvidenceComplianceRate() {
        return evidenceComplianceRate;
    }

    public void setEvidenceComplianceRate(BigDecimal evidenceComplianceRate) {
        this.evidenceComplianceRate = evidenceComplianceRate;
    }

    public BigDecimal getReworkRate() {
        return reworkRate;
    }

    public void setReworkRate(BigDecimal reworkRate) {
        this.reworkRate = reworkRate;
    }

    public BigDecimal getInspectionTurnaroundHours() {
        return inspectionTurnaroundHours;
    }

    public void setInspectionTurnaroundHours(BigDecimal inspectionTurnaroundHours) {
        this.inspectionTurnaroundHours = inspectionTurnaroundHours;
    }

    public BigDecimal getCorrectiveActionResolutionHours() {
        return correctiveActionResolutionHours;
    }

    public void setCorrectiveActionResolutionHours(BigDecimal correctiveActionResolutionHours) {
        this.correctiveActionResolutionHours = correctiveActionResolutionHours;
    }

    public Integer getWorkloadCount() {
        return workloadCount;
    }

    public void setWorkloadCount(Integer workloadCount) {
        this.workloadCount = workloadCount;
    }

    public BigDecimal getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(BigDecimal overallScore) {
        this.overallScore = overallScore;
    }

    public DataSufficiencyStatus getDataSufficiencyStatus() {
        return dataSufficiencyStatus;
    }

    public void setDataSufficiencyStatus(DataSufficiencyStatus dataSufficiencyStatus) {
        this.dataSufficiencyStatus = dataSufficiencyStatus;
    }

    public String getSampleCounts() {
        return sampleCounts;
    }

    public void setSampleCounts(String sampleCounts) {
        this.sampleCounts = sampleCounts;
    }

    public Instant getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(Instant calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
