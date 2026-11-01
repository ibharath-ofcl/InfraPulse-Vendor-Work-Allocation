package com.infrapulse.modules.workertrust.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.workertrust.enums.WorkerStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "workers")
public class Worker {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "worker_code", length = 50, nullable = false, unique = true)
    private String workerCode;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "photo_reference", length = 500)
    private String photoReference;

    @Column(name = "mobile_number", length = 50, nullable = false)
    private String mobileNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", length = 50, nullable = false)
    private WorkerStatus currentStatus = WorkerStatus.REGISTERED;

    @Column(name = "job_role", length = 100, nullable = false)
    private String jobRole = "GENERAL_WORKER";

    @Column(name = "skills_experience", columnDefinition = "TEXT")
    private String skillsExperience;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 50)
    private String emergencyContactPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Worker() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.currentStatus = WorkerStatus.REGISTERED;
    }

    public Worker(String workerCode, String fullName, String mobileNumber, String jobRole) {
        this();
        this.workerCode = workerCode;
        this.fullName = fullName;
        this.mobileNumber = mobileNumber;
        this.jobRole = jobRole != null ? jobRole : "GENERAL_WORKER";
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getWorkerCode() { return workerCode; }
    public void setWorkerCode(String workerCode) { this.workerCode = workerCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhotoReference() { return photoReference; }
    public void setPhotoReference(String photoReference) { this.photoReference = photoReference; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public WorkerStatus getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(WorkerStatus currentStatus) { this.currentStatus = currentStatus; }

    public String getJobRole() { return jobRole; }
    public void setJobRole(String jobRole) { this.jobRole = jobRole; }

    public String getSkillsExperience() { return skillsExperience; }
    public void setSkillsExperience(String skillsExperience) { this.skillsExperience = skillsExperience; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

