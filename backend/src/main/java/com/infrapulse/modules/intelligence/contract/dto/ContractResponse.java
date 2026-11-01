package com.infrapulse.modules.intelligence.contract.dto;

import com.infrapulse.modules.intelligence.contract.model.ContractStatus;
import com.infrapulse.modules.intelligence.contract.model.ContractType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ContractResponse(
    String id,
    String contractCode,
    String projectId,
    String projectName,
    String title,
    String contractorId,
    String contractorName,
    ContractType contractType,
    BigDecimal totalValue,
    ContractStatus status,
    int versionNumber,
    LocalDate startDate,
    LocalDate endDate,
    String description,
    long totalRequirements,
    long approvedRequirements,
    long verifiedRequirements,
    double compliancePercentage,
    Instant createdAt
) {}

