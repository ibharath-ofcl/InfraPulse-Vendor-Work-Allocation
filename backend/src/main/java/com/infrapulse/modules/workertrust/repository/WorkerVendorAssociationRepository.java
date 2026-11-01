package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerVendorAssociation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerVendorAssociationRepository extends JpaRepository<WorkerVendorAssociation, String> {

    List<WorkerVendorAssociation> findByWorkerId(String workerId);

    List<WorkerVendorAssociation> findByVendorId(String vendorId);

    Optional<WorkerVendorAssociation> findFirstByWorkerIdAndAssociationStatus(String workerId, String associationStatus);

    boolean existsByWorkerIdAndVendorIdAndAssociationStatus(String workerId, String vendorId, String associationStatus);
}

