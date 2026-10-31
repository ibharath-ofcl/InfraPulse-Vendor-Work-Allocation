package com.infrapulse.modules.humanreview.dto;

import com.infrapulse.modules.humanreview.model.MeasurementUnit;
import com.infrapulse.modules.humanreview.model.PhysicalMeasurementType;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class RecordMeasurementRequest {

    private String findingId;

    @NotNull(message = "Measurement type is required")
    private PhysicalMeasurementType measurementType;

    @NotNull(message = "Measured value is required")
    private Double measuredValue;

    @NotNull(message = "Unit is required")
    private MeasurementUnit unit;

    private String measurementMethod;
    private String instrumentReference;
    private String calibrationReference;
    private String specificationReference;
    private String specificationVersion;
    private Double minAcceptableValue;
    private Double maxAcceptableValue;
    private String remarks;
    private Instant measuredAt;

    public RecordMeasurementRequest() {}

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

    public String getSpecificationReference() { return specificationReference; }
    public void setSpecificationReference(String specificationReference) { this.specificationReference = specificationReference; }

    public String getSpecificationVersion() { return specificationVersion; }
    public void setSpecificationVersion(String specificationVersion) { this.specificationVersion = specificationVersion; }

    public Double getMinAcceptableValue() { return minAcceptableValue; }
    public void setMinAcceptableValue(Double minAcceptableValue) { this.minAcceptableValue = minAcceptableValue; }

    public Double getMaxAcceptableValue() { return maxAcceptableValue; }
    public void setMaxAcceptableValue(Double maxAcceptableValue) { this.maxAcceptableValue = maxAcceptableValue; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Instant getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(Instant measuredAt) { this.measuredAt = measuredAt; }
}
