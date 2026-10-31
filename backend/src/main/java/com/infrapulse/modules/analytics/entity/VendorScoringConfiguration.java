package com.infrapulse.modules.analytics.entity;

import com.infrapulse.modules.auth.model.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vendor_scoring_configurations")
public class VendorScoringConfiguration {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "configuration_name", length = 100, nullable = false)
    private String configurationName;

    @Column(name = "version", nullable = false)
    private int version = 1;

    @Column(name = "quality_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal qualityWeight = new BigDecimal("30.00");

    @Column(name = "on_time_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal onTimeWeight = new BigDecimal("25.00");

    @Column(name = "evidence_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal evidenceWeight = new BigDecimal("15.00");

    @Column(name = "rework_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal reworkWeight = new BigDecimal("20.00");

    @Column(name = "completion_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal completionWeight = new BigDecimal("10.00");

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public VendorScoringConfiguration() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }

    public boolean validateWeightsSumTo100() {
        BigDecimal sum = BigDecimal.ZERO;
        if (qualityWeight != null) sum = sum.add(qualityWeight);
        if (onTimeWeight != null) sum = sum.add(onTimeWeight);
        if (evidenceWeight != null) sum = sum.add(evidenceWeight);
        if (reworkWeight != null) sum = sum.add(reworkWeight);
        if (completionWeight != null) sum = sum.add(completionWeight);
        return sum.compareTo(new BigDecimal("100.00")) == 0;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getConfigurationName() {
        return configurationName;
    }

    public void setConfigurationName(String configurationName) {
        this.configurationName = configurationName;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public BigDecimal getQualityWeight() {
        return qualityWeight;
    }

    public void setQualityWeight(BigDecimal qualityWeight) {
        this.qualityWeight = qualityWeight;
    }

    public BigDecimal getOnTimeWeight() {
        return onTimeWeight;
    }

    public void setOnTimeWeight(BigDecimal onTimeWeight) {
        this.onTimeWeight = onTimeWeight;
    }

    public BigDecimal getEvidenceWeight() {
        return evidenceWeight;
    }

    public void setEvidenceWeight(BigDecimal evidenceWeight) {
        this.evidenceWeight = evidenceWeight;
    }

    public BigDecimal getReworkWeight() {
        return reworkWeight;
    }

    public void setReworkWeight(BigDecimal reworkWeight) {
        this.reworkWeight = reworkWeight;
    }

    public BigDecimal getCompletionWeight() {
        return completionWeight;
    }

    public void setCompletionWeight(BigDecimal completionWeight) {
        this.completionWeight = completionWeight;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
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
}
