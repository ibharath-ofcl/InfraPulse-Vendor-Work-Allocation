package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, String> {

    Optional<FinancialTransaction> findByTransactionReference(String transactionReference);

    List<FinancialTransaction> findByPaymentAuthorizationIdOrderByCreatedAtDesc(String paymentAuthorizationId);
}
