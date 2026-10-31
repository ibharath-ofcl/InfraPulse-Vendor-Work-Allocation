package com.infrapulse.modules.evidence.dto;

import java.time.Instant;

public class EvidenceIntegrityResponse {

    private String evidenceId;
    private String evidenceCode;
    private String storedChecksum;
    private String calculatedChecksum;
    private boolean integrityValid;
    private Instant verifiedAt;
    private String statusMessage;

    public EvidenceIntegrityResponse() {}

    public EvidenceIntegrityResponse(String evidenceId, String evidenceCode, String storedChecksum, String calculatedChecksum, boolean integrityValid, Instant verifiedAt, String statusMessage) {
        this.evidenceId = evidenceId;
        this.evidenceCode = evidenceCode;
        this.storedChecksum = storedChecksum;
        this.calculatedChecksum = calculatedChecksum;
        this.integrityValid = integrityValid;
        this.verifiedAt = verifiedAt;
        this.statusMessage = statusMessage;
    }

    public String getEvidenceId() {
        return evidenceId;
    }

    public void setEvidenceId(String evidenceId) {
        this.evidenceId = evidenceId;
    }

    public String getEvidenceCode() {
        return evidenceCode;
    }

    public void setEvidenceCode(String evidenceCode) {
        this.evidenceCode = evidenceCode;
    }

    public String getStoredChecksum() {
        return storedChecksum;
    }

    public void setStoredChecksum(String storedChecksum) {
        this.storedChecksum = storedChecksum;
    }

    public String getCalculatedChecksum() {
        return calculatedChecksum;
    }

    public void setCalculatedChecksum(String calculatedChecksum) {
        this.calculatedChecksum = calculatedChecksum;
    }

    public boolean isIntegrityValid() {
        return integrityValid;
    }

    public void setIntegrityValid(boolean integrityValid) {
        this.integrityValid = integrityValid;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}
