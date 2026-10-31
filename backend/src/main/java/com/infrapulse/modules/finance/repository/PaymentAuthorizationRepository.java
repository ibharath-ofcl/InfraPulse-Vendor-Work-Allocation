package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.PaymentAuthorization;
import com.infrapulse.modules.finance.enums.PaymentAuthorizationStatus;
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
public interface PaymentAuthorizationRepository extends JpaRepository<PaymentAuthorization, String>, JpaSpecificationExecutor<PaymentAuthorization> {

    Optional<PaymentAuthorization> findByPaymentCode(String paymentCode);

    Optional<PaymentAuthorization> findByAuthorizationReference(String authorizationReference);

    Optional<PaymentAuthorization> findByIdempotencyKey(String idempotencyKey);

    List<PaymentAuthorization> findByMilestoneId(String milestoneId);

    List<PaymentAuthorization> findByPaymentRequestId(String paymentRequestId);

    Page<PaymentAuthorization> findByProjectId(String projectId, Pageable pageable);

    List<PaymentAuthorization> findByProjectId(String projectId);

    Page<PaymentAuthorization> findByVendorId(String vendorId, Pageable pageable);

    List<PaymentAuthorization> findByVendorId(String vendorId);

    Page<PaymentAuthorization> findByStatus(PaymentAuthorizationStatus status, Pageable pageable);

    @Query("""
        SELECT COALESCE(SUM(pa.authorizedAmount), 0) FROM PaymentAuthorization pa
        WHERE pa.milestone.id = :milestoneId AND pa.status IN ('AUTHORIZED', 'PROCESSING', 'SETTLED_SIMULATED')
    """)
    BigDecimal sumAuthorizedAmountByMilestoneId(@Param("milestoneId") String milestoneId);

    @Query("""
        SELECT COALESCE(SUM(pa.authorizedAmount), 0) FROM PaymentAuthorization pa
        WHERE pa.milestone.id = :milestoneId AND pa.status = 'SETTLED_SIMULATED'
    """)
    BigDecimal sumSettledAmountByMilestoneId(@Param("milestoneId") String milestoneId);

    @Query("""
        SELECT COALESCE(SUM(pa.authorizedAmount), 0) FROM PaymentAuthorization pa
        WHERE pa.status IN ('AUTHORIZED', 'PROCESSING', 'SETTLED_SIMULATED')
    """)
    BigDecimal sumTotalAuthorizedAmount();

    @Query("""
        SELECT COALESCE(SUM(pa.authorizedAmount), 0) FROM PaymentAuthorization pa
        WHERE pa.status = 'SETTLED_SIMULATED'
    """)
    BigDecimal sumTotalSettledAmount();
}
