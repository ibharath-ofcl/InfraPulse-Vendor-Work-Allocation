package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.InvoiceVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceVerificationRepository extends JpaRepository<InvoiceVerification, String> {

    List<InvoiceVerification> findByPaymentRequestIdOrderByVerifiedAtDesc(String paymentRequestId);

    Optional<InvoiceVerification> findFirstByPaymentRequestIdOrderByVerifiedAtDesc(String paymentRequestId);
}
