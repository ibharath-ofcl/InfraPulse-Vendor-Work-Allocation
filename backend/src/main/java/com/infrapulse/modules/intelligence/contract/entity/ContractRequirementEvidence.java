package com.infrapulse.modules.intelligence.contract.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.intelligence.contract.model.RequirementEvidenceStatus;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contract_requirement_evidence")
public class ContractRequirementEvidence {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private ContractRequirement requirement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private WorkEvidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private WorkAssignment assignment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RequirementEvidenceStatus status = RequirementEvidenceStatus.EVIDENCE_PENDING;

    @Column(name = "measured_value", length = 64)
    private String measuredValue;

    @Column(name = "measurement_unit", length = 32)
    private String measurementUnit;

    @Column(name = "physical_measurement_tool", length = 128)
    private String physicalMeasurementTool;

    @Column(name = "measurement_notes", columnDefinition = "TEXT")
    private String measurementNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measured_by")
    private User measuredBy;

    @Column(name = "measured_at")
    private Instant measuredAt;

    @Column(name = "waiver_reason", columnDefinition = "TEXT")
    private String waiverReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waived_by")
    private User waivedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ContractRequirementEvidence() {
        this.id = UUID.randomUUID().toString();
    }

    public ContractRequirementEvidence(ContractRequirement requirement, WorkAssignment assignment, WorkEvidence evidence) {
        this();
        this.requirement = requirement;
        this.assignment = assignment;
        this.evidence = evidence;
        this.status = evidence != null ? RequirementEvidenceStatus.EVIDENCE_SUBMITTED : RequirementEvidenceStatus.EVIDENCE_PENDING;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ContractRequirement getRequirement() { return requirement; }
    public void setRequirement(ContractRequirement requirement) { this.requirement = requirement; }

    public WorkEvidence getEvidence() { return evidence; }
    public void setEvidence(WorkEvidence evidence) { this.evidence = evidence; }

    public WorkAssignment getAssignment() { return assignment; }
    public void setAssignment(WorkAssignment assignment) { this.assignment = assignment; }

    public RequirementEvidenceStatus getStatus() { return status; }
    public void setStatus(RequirementEvidenceStatus status) { this.status = status; }

    public String getMeasuredValue() { return measuredValue; }
    public void setMeasuredValue(String measuredValue) { this.measuredValue = measuredValue; }

    public String getMeasurementUnit() { return measurementUnit; }
    public void setMeasurementUnit(String measurementUnit) { this.measurementUnit = measurementUnit; }

    public String getPhysicalMeasurementTool() { return physicalMeasurementTool; }
    public void setPhysicalMeasurementTool(String physicalMeasurementTool) { this.physicalMeasurementTool = physicalMeasurementTool; }

    public String getMeasurementNotes() { return measurementNotes; }
    public void setMeasurementNotes(String measurementNotes) { this.measurementNotes = measurementNotes; }

    public User getMeasuredBy() { return measuredBy; }
    public void setMeasuredBy(User measuredBy) { this.measuredBy = measuredBy; }

    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }

    public String getWaiverReason() { return waiverReason; }
    public void setWaiverReason(String waiverReason) { this.waiverReason = waiverReason; }

    public User getWaivedBy() { return waivedBy; }
    public void setWaivedBy(User waivedBy) { this.waivedBy = waivedBy; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
