package com.infrapulse.modules.intelligence.contract.dto;

import jakarta.validation.constraints.NotBlank;

public record RecordMeasurementRequest(
    @NotBlank(message = "Measured value is mandatory")
    String measuredValue,

    String measurementUnit,

    @NotBlank(message = "Measurement tool is mandatory")
    String physicalMeasurementTool,

    String measurementNotes
) {}
