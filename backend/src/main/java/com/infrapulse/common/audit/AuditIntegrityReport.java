package com.infrapulse.common.audit;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AuditIntegrityReport {

    private String chainScope;
    private AuditIntegrityStatus status;
    private long totalEventsChecked;
    private long validEventsCount;
    private long invalidEventsCount;
    private String lastVerifiedEventCode;
    private String lastVerifiedEventHash;
    private Instant verifiedAt;
    private List<String> violations = new ArrayList<>();

    public AuditIntegrityReport() {
        this.verifiedAt = Instant.now();
    }

    public AuditIntegrityReport(String chainScope, AuditIntegrityStatus status, long totalEventsChecked, long validEventsCount, long invalidEventsCount) {
        this.chainScope = chainScope;
        this.status = status;
        this.totalEventsChecked = totalEventsChecked;
        this.validEventsCount = validEventsCount;
        this.invalidEventsCount = invalidEventsCount;
        this.verifiedAt = Instant.now();
    }

    public String getChainScope() {
        return chainScope;
    }

    public void setChainScope(String chainScope) {
        this.chainScope = chainScope;
    }

    public AuditIntegrityStatus getStatus() {
        return status;
    }

    public void setStatus(AuditIntegrityStatus status) {
        this.status = status;
    }

    public long getTotalEventsChecked() {
        return totalEventsChecked;
    }

    public void setTotalEventsChecked(long totalEventsChecked) {
        this.totalEventsChecked = totalEventsChecked;
    }

    public long getValidEventsCount() {
        return validEventsCount;
    }

    public void setValidEventsCount(long validEventsCount) {
        this.validEventsCount = validEventsCount;
    }

    public long getInvalidEventsCount() {
        return invalidEventsCount;
    }

    public void setInvalidEventsCount(long invalidEventsCount) {
        this.invalidEventsCount = invalidEventsCount;
    }

    public String getLastVerifiedEventCode() {
        return lastVerifiedEventCode;
    }

    public void setLastVerifiedEventCode(String lastVerifiedEventCode) {
        this.lastVerifiedEventCode = lastVerifiedEventCode;
    }

    public String getLastVerifiedEventHash() {
        return lastVerifiedEventHash;
    }

    public void setLastVerifiedEventHash(String lastVerifiedEventHash) {
        this.lastVerifiedEventHash = lastVerifiedEventHash;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public List<String> getViolations() {
        return violations;
    }

    public void setViolations(List<String> violations) {
        this.violations = violations;
    }
}
