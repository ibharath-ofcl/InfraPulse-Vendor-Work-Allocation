package com.infrapulse.modules.analytics.repository;

import com.infrapulse.modules.analytics.entity.VendorPerformanceSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorPerformanceSnapshotRepository extends JpaRepository<VendorPerformanceSnapshot, String> {

    List<VendorPerformanceSnapshot> findByVendorIdOrderByCalculatedAtDesc(String vendorId);

    Optional<VendorPerformanceSnapshot> findFirstByVendorIdOrderByCalculatedAtDesc(String vendorId);

    Page<VendorPerformanceSnapshot> findByProjectIdOrderByCalculatedAtDesc(String projectId, Pageable pageable);
}
