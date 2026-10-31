package com.infrapulse.modules.finance.enums;

public enum MilestoneStatus {
    DRAFT,
    SCHEDULED,
    IN_PROGRESS,
    PENDING_VERIFICATION,
    VERIFICATION_FAILED,
    ELIGIBLE_FOR_PAYMENT,
    PAYMENT_REQUESTED,
    PAYMENT_APPROVED,
    PARTIALLY_PAID,
    PAID,
    ON_HOLD,
    CANCELLED;

    public boolean isPayable() {
        return this == ELIGIBLE_FOR_PAYMENT || this == PARTIALLY_PAID;
    }

    public boolean isTerminal() {
        return this == PAID || this == CANCELLED;
    }
}
