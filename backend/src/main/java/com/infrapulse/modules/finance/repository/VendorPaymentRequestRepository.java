package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.VendorPaymentRequest;
import com.infrapulse.modules.finance.enums.PaymentRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface VendorPaymentRequestRepository extends JpaRepository<VendorPaymentRequest, String>, JpaSpecificationExecutor<VendorPaymentRequest> {

    Optional<VendorPaymentRequest> findByPaymentRequestCode(String paymentRequestCode);

    List<VendorPaymentRequest> findByMilestoneId(String milestoneId);

    List<VendorPaymentRequest> findByVendorId(String vendorId);

    List<VendorPaymentRequest> findByProjectId(String projectId);

    Page<VendorPaymentRequest> findByVendorId(String vendorId, Pageable pageable);

    Page<VendorPaymentRequest> findByProjectId(String projectId, Pageable pageable);

    Page<VendorPaymentRequest> findByStatus(PaymentRequestStatus status, Pageable pageable);

    Page<VendorPaymentRequest> findByStatusIn(List<PaymentRequestStatus> statuses, Pageable pageable);

    boolean existsByProjectIdAndVendorIdAndInvoiceNumber(String projectId, String vendorId, String invoiceNumber);

    @Query("""
        SELECT COALESCE(SUM(pr.requestedAmount), 0) FROM VendorPaymentRequest pr
        WHERE pr.milestone.id = :milestoneId AND pr.status IN ('SUBMITTED', 'UNDER_FINANCIAL_REVIEW', 'APPROVED', 'AUTHORIZED')
    """)
    BigDecimal sumActiveRequestedAmountByMilestoneId(@Param("milestoneId") String milestoneId);

    long countByStatus(PaymentRequestStatus status);
}
