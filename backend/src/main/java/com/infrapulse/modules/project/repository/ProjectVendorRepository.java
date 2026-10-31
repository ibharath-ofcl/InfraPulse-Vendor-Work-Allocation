package com.infrapulse.modules.project.repository;

import com.infrapulse.modules.project.entity.ProjectVendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectVendorRepository extends JpaRepository<ProjectVendor, String> {

    List<ProjectVendor> findByProjectId(String projectId);

    List<ProjectVendor> findByProjectIdAndAssociationStatus(String projectId, String associationStatus);

    List<ProjectVendor> findByVendorId(String vendorId);

    List<ProjectVendor> findByVendorIdAndAssociationStatus(String vendorId, String associationStatus);

    Optional<ProjectVendor> findByProjectIdAndVendorIdAndAssociationStatus(String projectId, String vendorId, String associationStatus);

    Optional<ProjectVendor> findFirstByProjectIdAndVendorIdOrderByAssociatedAtDesc(String projectId, String vendorId);

    boolean existsByProjectIdAndVendorIdAndAssociationStatus(String projectId, String vendorId, String associationStatus);

    @Query("""
        SELECT COUNT(pv) > 0 FROM ProjectVendor pv
        WHERE pv.project.id = :projectId AND pv.vendor.id = :vendorId AND pv.associationStatus = 'ACTIVE'
    """)
    boolean hasActiveAssociation(@Param("projectId") String projectId, @Param("vendorId") String vendorId);
}
