package com.infrapulse.modules.vendor.repository;

import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.enums.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, String>, JpaSpecificationExecutor<Vendor> {

    Optional<Vendor> findByVendorCode(String vendorCode);

    boolean existsByVendorCode(String vendorCode);

    Optional<Vendor> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Vendor> findByUserId(String userId);

    Page<Vendor> findByStatus(VendorStatus status, Pageable pageable);

    @Query("""
        SELECT DISTINCT v FROM Vendor v
        JOIN ProjectVendor pv ON pv.vendor.id = v.id
        WHERE pv.project.projectManager.id = :managerId AND pv.associationStatus = 'ACTIVE'
    """)
    Page<Vendor> findVendorsForProjectManager(@Param("managerId") String managerId, Pageable pageable);
}
