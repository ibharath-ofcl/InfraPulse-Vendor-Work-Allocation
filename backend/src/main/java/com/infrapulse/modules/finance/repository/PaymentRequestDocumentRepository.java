package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.PaymentRequestDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRequestDocumentRepository extends JpaRepository<PaymentRequestDocument, String> {

    List<PaymentRequestDocument> findByPaymentRequestId(String paymentRequestId);
}
