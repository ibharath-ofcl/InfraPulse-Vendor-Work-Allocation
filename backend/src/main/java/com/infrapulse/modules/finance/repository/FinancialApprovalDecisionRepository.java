package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.FinancialApprovalDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialApprovalDecisionRepository extends JpaRepository<FinancialApprovalDecision, String> {

    List<FinancialApprovalDecision> findByPaymentRequestIdOrderByDecidedAtDesc(String paymentRequestId);

    Optional<FinancialApprovalDecision> findFirstByPaymentRequestIdOrderByDecidedAtDesc(String paymentRequestId);

    boolean existsByPaymentRequestIdAndReviewerId(String paymentRequestId, String reviewerId);
}
