package com.infrapulse.modules.workzone.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateWorkZoneRequest(
    @NotBlank(message = "Associated project ID is mandatory")
    String projectId,

    @NotBlank(message = "Work zone name is mandatory")
    @Size(max = 255, message = "Zone name cannot exceed 255 characters")
    String zoneName,

    String description,

    @NotBlank(message = "PIN code is mandatory")
    @Pattern(regexp = "^\\d{6}$", message = "PIN code must be exactly 6 numeric digits")
    String pincode,

    @NotBlank(message = "Locality is mandatory")
    @Size(max = 150, message = "Locality cannot exceed 150 characters")
    String locality,

    @NotBlank(message = "District is mandatory")
    @Size(max = 100, message = "District cannot exceed 100 characters")
    String district,

    @NotBlank(message = "State is mandatory")
    @Size(max = 100, message = "State cannot exceed 100 characters")
    String state,

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    BigDecimal centerLatitude,

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    BigDecimal centerLongitude
) {}
