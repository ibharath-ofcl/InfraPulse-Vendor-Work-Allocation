package com.infrapulse.modules.humanreview.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.humanreview.model.MeasurementUnit;
import com.infrapulse.modules.humanreview.model.MeasurementVerificationStatus;
import com.infrapulse.modules.humanreview.model.PhysicalMeasurementType;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.entity.QualityAssessmentFinding;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "physical_measurements")
public class PhysicalMeasurement {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "measurement_code", length = 64, nullable = false, unique = true)
    private String measurementCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private QualityAssessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finding_id")
    private QualityAssessmentFinding finding;

    @Enumerated(EnumType.STRING)
    @Column(name = "measurement_type", length = 64, nullable = false)
    private PhysicalMeasurementType measurementType;

    @Column(name = "measured_value", nullable = false)
    private Double measuredValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", length = 32, nullable = false)
    private MeasurementUnit unit;

    @Column(name = "measurement_method", length = 128)
    private String measurementMethod;

    @Column(name = "instrument_reference", length = 128)
    private String instrumentReference;

    @Column(name = "calibration_reference", length = 128)
    private String calibrationReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_id", nullable = false)
    private User inspector;

    @Column(name = "specification_reference")
    private String specificationReference;

    @Column(name = "specification_version", length = 64)
    private String specificationVersion;

    @Column(name = "min_acceptable_value")
    private Double minAcceptableValue;

    @Column(name = "max_acceptable_value")
    private Double maxAcceptableValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 64, nullable = false)
    private MeasurementVerificationStatus verificationStatus = MeasurementVerificationStatus.PENDING;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public PhysicalMeasurement() {
        this.id = UUID.randomUUID().toString();
        this.measuredAt = Instant.now();
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (measuredAt == null) measuredAt = Instant.now();
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMeasurementCode() { return measurementCode; }
    public void setMeasurementCode(String measurementCode) { this.measurementCode = measurementCode; }

    public QualityAssessment getAssessment() { return assessment; }
    public void setAssessment(QualityAssessment assessment) { this.assessment = assessment; }

    public QualityAssessmentFinding getFinding() { return finding; }
    public void setFinding(QualityAssessmentFinding finding) { this.finding = finding; }

    public PhysicalMeasurementType getMeasurementType() { return measurementType; }
    public void setMeasurementType(PhysicalMeasurementType measurementType) { this.measurementType = measurementType; }

    public Double getMeasuredValue() { return measuredValue; }
    public void setMeasuredValue(Double measuredValue) { this.measuredValue = measuredValue; }

    public MeasurementUnit getUnit() { return unit; }
    public void setUnit(MeasurementUnit unit) { this.unit = unit; }

    public String getMeasurementMethod() { return measurementMethod; }
    public void setMeasurementMethod(String measurementMethod) { this.measurementMethod = measurementMethod; }

    public String getInstrumentReference() { return instrumentReference; }
    public void setInstrumentReference(String instrumentReference) { this.instrumentReference = instrumentReference; }

    public String getCalibrationReference() { return calibrationReference; }
    public void setCalibrationReference(String calibrationReference) { this.calibrationReference = calibrationReference; }

    public User getInspector() { return inspector; }
    public void setInspector(User inspector) { this.inspector = inspector; }

    public String getSpecificationReference() { return specificationReference; }
    public void setSpecificationReference(String specificationReference) { this.specificationReference = specificationReference; }

    public String getSpecificationVersion() { return specificationVersion; }
    public void setSpecificationVersion(String specificationVersion) { this.specificationVersion = specificationVersion; }

    public Double getMinAcceptableValue() { return minAcceptableValue; }
    public void setMinAcceptableValue(Double minAcceptableValue) { this.minAcceptableValue = minAcceptableValue; }

    public Double getMaxAcceptableValue() { return maxAcceptableValue; }
    public void setMaxAcceptableValue(Double maxAcceptableValue) { this.maxAcceptableValue = maxAcceptableValue; }

    public MeasurementVerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(MeasurementVerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
