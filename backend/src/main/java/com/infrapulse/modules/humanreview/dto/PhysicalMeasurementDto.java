package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.entity.PhysicalMeasurement;
import com.infrapulse.modules.humanreview.model.MeasurementUnit;
import com.infrapulse.modules.humanreview.model.MeasurementVerificationStatus;
import com.infrapulse.modules.humanreview.model.PhysicalMeasurementType;

import java.time.Instant;

public class PhysicalMeasurementDto {
    private String id;
    private String measurementCode;
    private String assessmentId;
    private String findingId;
    private PhysicalMeasurementType measurementType;
    private Double measuredValue;
    private MeasurementUnit unit;
    private String measurementMethod;
    private String instrumentReference;
    private String calibrationReference;
    private String inspectorId;
    private String inspectorName;
    private String specificationReference;
    private String specificationVersion;
    private Double minAcceptableValue;
    private Double maxAcceptableValue;
    private MeasurementVerificationStatus verificationStatus;
    private String remarks;
    private Instant measuredAt;
    private Instant createdAt;

    public PhysicalMeasurementDto() {}

    public static PhysicalMeasurementDto fromEntity(PhysicalMeasurement pm) {
        PhysicalMeasurementDto dto = new PhysicalMeasurementDto();
        dto.setId(pm.getId());
        dto.setMeasurementCode(pm.getMeasurementCode());
        if (pm.getAssessment() != null) {
            dto.setAssessmentId(pm.getAssessment().getId());
        }
        if (pm.getFinding() != null) {
            dto.setFindingId(pm.getFinding().getId());
        }
        dto.setMeasurementType(pm.getMeasurementType());
        dto.setMeasuredValue(pm.getMeasuredValue());
        dto.setUnit(pm.getUnit());
        dto.setMeasurementMethod(pm.getMeasurementMethod());
        dto.setInstrumentReference(pm.getInstrumentReference());
        dto.setCalibrationReference(pm.getCalibrationReference());
        if (pm.getInspector() != null) {
            dto.setInspectorId(pm.getInspector().getId());
            dto.setInspectorName(pm.getInspector().getFullName());
        }
        dto.setSpecificationReference(pm.getSpecificationReference());
        dto.setSpecificationVersion(pm.getSpecificationVersion());
        dto.setMinAcceptableValue(pm.getMinAcceptableValue());
        dto.setMaxAcceptableValue(pm.getMaxAcceptableValue());
        dto.setVerificationStatus(pm.getVerificationStatus());
        dto.setRemarks(pm.getRemarks());
        dto.setMeasuredAt(pm.getMeasuredAt());
        dto.setCreatedAt(pm.getCreatedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMeasurementCode() { return measurementCode; }
    public void setMeasurementCode(String measurementCode) { this.measurementCode = measurementCode; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getFindingId() { return findingId; }
    public void setFindingId(String findingId) { this.findingId = findingId; }

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

    public String getInspectorId() { return inspectorId; }
    public void setInspectorId(String inspectorId) { this.inspectorId = inspectorId; }

    public String getInspectorName() { return inspectorName; }
    public void setInspectorName(String inspectorName) { this.inspectorName = inspectorName; }

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
