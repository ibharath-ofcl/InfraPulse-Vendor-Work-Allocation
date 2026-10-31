package com.infrapulse.modules.finance.entity;

import com.infrapulse.modules.auth.model.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "milestone_verifications")
public class MilestoneVerification {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private ProjectMilestone milestone;

    @Column(name = "verification_status", length = 64, nullable = false)
    private String verificationStatus;

    @Column(name = "eligibility_result", nullable = false)
    private boolean eligibilityResult;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "blocking_conditions", columnDefinition = "TEXT")
    private String blockingConditions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at", nullable = false)
    private Instant verifiedAt;

    public MilestoneVerification() {
        this.id = UUID.randomUUID().toString();
        this.verifiedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ProjectMilestone getMilestone() {
        return milestone;
    }

    public void setMilestone(ProjectMilestone milestone) {
        this.milestone = milestone;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public boolean isEligibilityResult() {
        return eligibilityResult;
    }

    public void setEligibilityResult(boolean eligibilityResult) {
        this.eligibilityResult = eligibilityResult;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getBlockingConditions() {
        return blockingConditions;
    }

    public void setBlockingConditions(String blockingConditions) {
        this.blockingConditions = blockingConditions;
    }

    public User getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(User verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
