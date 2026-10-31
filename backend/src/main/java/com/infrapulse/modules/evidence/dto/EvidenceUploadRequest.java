package com.infrapulse.modules.evidence.dto;

import com.infrapulse.modules.evidence.model.EvidenceCategory;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class EvidenceUploadRequest {

    @NotNull(message = "Evidence category is required")
    private EvidenceCategory category;

    private String description;

    private String captureTimestamp;

    private BigDecimal latitude;

    private BigDecimal longitude;

    public EvidenceUploadRequest() {}

    public EvidenceUploadRequest(EvidenceCategory category, String description, String captureTimestamp, BigDecimal latitude, BigDecimal longitude) {
        this.category = category;
        this.description = description;
        this.captureTimestamp = captureTimestamp;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public EvidenceCategory getCategory() {
        return category;
    }

    public void setCategory(EvidenceCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCaptureTimestamp() {
        return captureTimestamp;
    }

    public void setCaptureTimestamp(String captureTimestamp) {
        this.captureTimestamp = captureTimestamp;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }
}
