package com.infrapulse.modules.finance.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class AuthorizePaymentRequest {

    @NotBlank(message = "Idempotency key is required to prevent duplicate authorizations")
    private String idempotencyKey;

    private BigDecimal authorizedAmount;

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public BigDecimal getAuthorizedAmount() {
        return authorizedAmount;
    }

    public void setAuthorizedAmount(BigDecimal authorizedAmount) {
        this.authorizedAmount = authorizedAmount;
    }
}
