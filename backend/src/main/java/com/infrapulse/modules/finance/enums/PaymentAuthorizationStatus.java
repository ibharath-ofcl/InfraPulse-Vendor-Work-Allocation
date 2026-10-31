package com.infrapulse.modules.finance.enums;

public enum PaymentAuthorizationStatus {
    PENDING_AUTHORIZATION,
    AUTHORIZED,
    PROCESSING,
    SETTLED_SIMULATED,
    FAILED_SIMULATED,
    CANCELLED
}
