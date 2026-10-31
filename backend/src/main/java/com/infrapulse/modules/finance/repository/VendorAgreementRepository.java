package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.VendorAgreement;
import com.infrapulse.modules.finance.enums.AgreementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorAgreementRepository extends JpaRepository<VendorAgreement, String>, JpaSpecificationExecutor<VendorAgreement> {

    Optional<VendorAgreement> findByAgreementCode(String agreementCode);

    List<VendorAgreement> findByProjectId(String projectId);

    List<VendorAgreement> findByProjectIdAndVendorId(String projectId, String vendorId);

    List<VendorAgreement> findByVendorId(String vendorId);

    Page<VendorAgreement> findByProjectId(String projectId, Pageable pageable);

    Page<VendorAgreement> findByVendorId(String vendorId, Pageable pageable);

    Page<VendorAgreement> findByStatus(AgreementStatus status, Pageable pageable);

    boolean existsByProjectIdAndVendorIdAndStatus(String projectId, String vendorId, AgreementStatus status);
}
