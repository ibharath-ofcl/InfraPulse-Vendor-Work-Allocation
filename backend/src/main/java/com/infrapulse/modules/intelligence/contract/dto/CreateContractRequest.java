package com.infrapulse.modules.intelligence.contract.dto;

import com.infrapulse.modules.intelligence.contract.model.ContractType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateContractRequest(
    @NotBlank(message = "Project ID is mandatory")
    String projectId,

    String contractCode,

    @NotBlank(message = "Contract title is mandatory")
    String title,

    String contractorId,

    ContractType contractType,

    BigDecimal totalValue,

    LocalDate startDate,

    LocalDate endDate,

    String description
) {}
