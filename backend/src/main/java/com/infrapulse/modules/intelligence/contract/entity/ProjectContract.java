package com.infrapulse.modules.intelligence.contract.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.intelligence.contract.model.ContractStatus;
import com.infrapulse.modules.intelligence.contract.model.ContractType;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_contracts")
public class ProjectContract {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "contract_code", unique = true, nullable = false, length = 64)
    private String contractCode;

    @Column(nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contractor_id")
    private Vendor contractor;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false, length = 64)
    private ContractType contractType = ContractType.CIVIL_INFRASTRUCTURE;

    @Column(name = "total_value", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "version_number", nullable = false)
    private int versionNumber = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ProjectContract() {
        this.id = UUID.randomUUID().toString();
    }

    public ProjectContract(Project project, String contractCode, String title, Vendor contractor, ContractType contractType, BigDecimal totalValue, User uploadedBy) {
        this();
        this.project = project;
        this.contractCode = contractCode;
        this.title = title;
        this.contractor = contractor;
        this.contractType = contractType != null ? contractType : ContractType.CIVIL_INFRASTRUCTURE;
        this.totalValue = totalValue != null ? totalValue : BigDecimal.ZERO;
        this.uploadedBy = uploadedBy;
        this.status = ContractStatus.DRAFT;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Vendor getContractor() { return contractor; }
    public void setContractor(Vendor contractor) { this.contractor = contractor; }

    public ContractType getContractType() { return contractType; }
    public void setContractType(ContractType contractType) { this.contractType = contractType; }

    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }

    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus status) { this.status = status; }

    public int getVersionNumber() { return versionNumber; }
    public void setVersionNumber(int versionNumber) { this.versionNumber = versionNumber; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

