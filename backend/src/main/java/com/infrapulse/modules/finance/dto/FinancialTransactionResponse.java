package com.infrapulse.modules.finance.dto;

import com.infrapulse.modules.finance.enums.TransactionStatus;
import com.infrapulse.modules.finance.enums.TransactionType;
import java.math.BigDecimal;
import java.time.Instant;

public class FinancialTransactionResponse {

    private String id;
    private String paymentAuthorizationId;
    private TransactionType transactionType;
    private BigDecimal amount;
    private String currency;
    private String transactionReference;
    private TransactionStatus status;
    private String description;
    private boolean simulationMode;
    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPaymentAuthorizationId() {
        return paymentAuthorizationId;
    }

    public void setPaymentAuthorizationId(String paymentAuthorizationId) {
        this.paymentAuthorizationId = paymentAuthorizationId;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isSimulationMode() {
        return simulationMode;
    }

    public void setSimulationMode(boolean simulationMode) {
        this.simulationMode = simulationMode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
