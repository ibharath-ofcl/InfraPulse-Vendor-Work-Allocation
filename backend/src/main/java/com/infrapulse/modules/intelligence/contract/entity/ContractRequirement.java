package com.infrapulse.modules.intelligence.contract.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.intelligence.contract.model.RequirementApprovalStatus;
import com.infrapulse.modules.intelligence.contract.model.RequirementCategory;
import com.infrapulse.modules.intelligence.contract.model.VerificationMethod;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workzone.entity.WorkZone;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contract_requirements")
public class ContractRequirement {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "requirement_code", unique = true, nullable = false, length = 64)
    private String requirementCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private ProjectContract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "work_package", nullable = false, length = 128)
    private String workPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_zone_id")
    private WorkZone workZone;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private RequirementCategory category = RequirementCategory.SPECIFICATION;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT", nullable = false)
    private String acceptanceCriteria;

    @Column(name = "measurement_unit", length = 32)
    private String measurementUnit;

    @Column(name = "required_value", length = 64)
    private String requiredValue;

    @Column(name = "permitted_tolerance", length = 64)
    private String permittedTolerance;

    @Column(nullable = false)
    private boolean mandatory = true;

    @Column(name = "requires_human_inspection", nullable = false)
    private boolean requiresHumanInspection = true;

    @Column(name = "requires_physical_measurement", nullable = false)
    private boolean requiresPhysicalMeasurement = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", nullable = false, length = 64)
    private VerificationMethod verificationMethod = VerificationMethod.PHOTO_EVIDENCE;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 32)
    private RequirementApprovalStatus approvalStatus = RequirementApprovalStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ContractRequirement() {
        this.id = UUID.randomUUID().toString();
    }

    public ContractRequirement(ProjectContract contract, Project project, String requirementCode, String workPackage, String title, String description, RequirementCategory category, String acceptanceCriteria) {
        this();
        this.contract = contract;
        this.project = project;
        this.requirementCode = requirementCode;
        this.workPackage = workPackage;
        this.title = title;
        this.description = description;
        this.category = category != null ? category : RequirementCategory.SPECIFICATION;
        this.acceptanceCriteria = acceptanceCriteria;
        this.approvalStatus = RequirementApprovalStatus.DRAFT;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRequirementCode() { return requirementCode; }
    public void setRequirementCode(String requirementCode) { this.requirementCode = requirementCode; }

    public ProjectContract getContract() { return contract; }
    public void setContract(ProjectContract contract) { this.contract = contract; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getWorkPackage() { return workPackage; }
    public void setWorkPackage(String workPackage) { this.workPackage = workPackage; }

    public WorkZone getWorkZone() { return workZone; }
    public void setWorkZone(WorkZone workZone) { this.workZone = workZone; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public RequirementCategory getCategory() { return category; }
    public void setCategory(RequirementCategory category) { this.category = category; }

    public String getAcceptanceCriteria() { return acceptanceCriteria; }
    public void setAcceptanceCriteria(String acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; }

    public String getMeasurementUnit() { return measurementUnit; }
    public void setMeasurementUnit(String measurementUnit) { this.measurementUnit = measurementUnit; }

    public String getRequiredValue() { return requiredValue; }
    public void setRequiredValue(String requiredValue) { this.requiredValue = requiredValue; }

    public String getPermittedTolerance() { return permittedTolerance; }
    public void setPermittedTolerance(String permittedTolerance) { this.permittedTolerance = permittedTolerance; }

    public boolean isMandatory() { return mandatory; }
    public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }

    public boolean isRequiresHumanInspection() { return requiresHumanInspection; }
    public void setRequiresHumanInspection(boolean requiresHumanInspection) { this.requiresHumanInspection = requiresHumanInspection; }

    public boolean isRequiresPhysicalMeasurement() { return requiresPhysicalMeasurement; }
    public void setRequiresPhysicalMeasurement(boolean requiresPhysicalMeasurement) { this.requiresPhysicalMeasurement = requiresPhysicalMeasurement; }

    public VerificationMethod getVerificationMethod() { return verificationMethod; }
    public void setVerificationMethod(VerificationMethod verificationMethod) { this.verificationMethod = verificationMethod; }

    public RequirementApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(RequirementApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }

    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

