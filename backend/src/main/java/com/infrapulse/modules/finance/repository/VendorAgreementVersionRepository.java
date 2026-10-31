package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.VendorAgreementVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorAgreementVersionRepository extends JpaRepository<VendorAgreementVersion, String> {

    List<VendorAgreementVersion> findByAgreementIdOrderByVersionNumberDesc(String agreementId);

    Optional<VendorAgreementVersion> findByAgreementIdAndVersionNumber(String agreementId, int versionNumber);
}
