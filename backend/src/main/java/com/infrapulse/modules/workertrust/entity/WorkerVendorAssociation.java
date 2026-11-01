package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.vendor.entity.Vendor;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "worker_vendor_associations")
public class WorkerVendorAssociation {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "association_status", length = 50, nullable = false)
    private String associationStatus = "ACTIVE";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public WorkerVendorAssociation() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.associationStatus = "ACTIVE";
    }

    public WorkerVendorAssociation(Worker worker, Vendor vendor, LocalDate startDate) {
        this();
        this.worker = worker;
        this.vendor = vendor;
        this.startDate = startDate != null ? startDate : LocalDate.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Worker getWorker() { return worker; }
    public void setWorker(Worker worker) { this.worker = worker; }

    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }

    public String getAssociationStatus() { return associationStatus; }
    public void setAssociationStatus(String associationStatus) { this.associationStatus = associationStatus; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

