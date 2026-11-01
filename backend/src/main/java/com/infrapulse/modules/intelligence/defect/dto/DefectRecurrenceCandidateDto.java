package com.infrapulse.modules.intelligence.defect.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DefectRecurrenceCandidateDto(
    String id,
    String candidateDefectId,
    String candidateDefectCode,
    String candidateCategory,
    String candidateSeverity,
    String candidateStatus,
    BigDecimal similarityScore,
    BigDecimal spatialDistanceMeters,
    Integer temporalDistanceDays,
    String comparisonBasis,
    Boolean humanConfirmed,
    Instant createdAt
) {}
