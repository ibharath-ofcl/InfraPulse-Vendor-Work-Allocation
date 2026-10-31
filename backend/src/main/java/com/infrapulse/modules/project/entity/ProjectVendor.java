package com.infrapulse.modules.project.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.vendor.entity.Vendor;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_vendors")
public class ProjectVendor {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "association_status", length = 50, nullable = false)
    private String associationStatus = "ACTIVE";

    @Column(name = "associated_at", nullable = false)
    private Instant associatedAt;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "associated_by", nullable = false)
    private User associatedBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public ProjectVendor() {
    }

    public ProjectVendor(Project project, Vendor vendor, User associatedBy, String notes) {
        this.id = UUID.randomUUID().toString();
        this.project = project;
        this.vendor = vendor;
        this.associatedBy = associatedBy;
        this.notes = notes;
        this.associationStatus = "ACTIVE";
        this.associatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.associatedAt == null) {
            this.associatedAt = Instant.now();
        }
        if (this.associationStatus == null) {
            this.associationStatus = "ACTIVE";
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public String getAssociationStatus() {
        return associationStatus;
    }

    public void setAssociationStatus(String associationStatus) {
        this.associationStatus = associationStatus;
    }

    public Instant getAssociatedAt() {
        return associatedAt;
    }

    public void setAssociatedAt(Instant associatedAt) {
        this.associatedAt = associatedAt;
    }

    public Instant getDeactivatedAt() {
        return deactivatedAt;
    }

    public void setDeactivatedAt(Instant deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }

    public User getAssociatedBy() {
        return associatedBy;
    }

    public void setAssociatedBy(User associatedBy) {
        this.associatedBy = associatedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
