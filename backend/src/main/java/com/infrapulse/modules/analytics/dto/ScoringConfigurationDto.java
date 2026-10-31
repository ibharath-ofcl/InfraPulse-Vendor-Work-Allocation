package com.infrapulse.modules.analytics.dto;

import java.math.BigDecimal;

public class ScoringConfigurationDto {

    private String id;
    private String configurationName;
    private int version;
    private BigDecimal qualityWeight;
    private BigDecimal onTimeWeight;
    private BigDecimal evidenceWeight;
    private BigDecimal reworkWeight;
    private BigDecimal completionWeight;
    private boolean active;
    private String createdByName;
    private String createdAt;

    public ScoringConfigurationDto() {
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

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
