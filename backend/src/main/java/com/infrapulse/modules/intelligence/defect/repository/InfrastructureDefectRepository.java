package com.infrapulse.modules.intelligence.defect.repository;

import com.infrapulse.modules.intelligence.defect.entity.InfrastructureDefect;
import com.infrapulse.modules.intelligence.defect.model.DefectCategory;
import com.infrapulse.modules.intelligence.defect.model.DefectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InfrastructureDefectRepository extends JpaRepository<InfrastructureDefect, String> {

    Optional<InfrastructureDefect> findByDefectCode(String defectCode);

    List<InfrastructureDefect> findByEvidenceId(String evidenceId);

    List<InfrastructureDefect> findByProjectId(String projectId);

    Page<InfrastructureDefect> findByProjectId(String projectId, Pageable pageable);

    Page<InfrastructureDefect> findByVendorId(String vendorId, Pageable pageable);

    Page<InfrastructureDefect> findByRecurringTrue(Pageable pageable);

    long countByProjectId(String projectId);

    long countByProjectIdAndRecurringTrue(String projectId);

    long countByVendorId(String vendorId);

    long countByVendorIdAndStatus(String vendorId, DefectStatus status);

    @Query("SELECT d FROM InfrastructureDefect d WHERE (:projectId IS NULL OR d.project.id = :projectId) " +
           "AND (:vendorId IS NULL OR (d.vendor IS NOT NULL AND d.vendor.id = :vendorId)) " +
           "AND (:category IS NULL OR d.category = :category) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:recurring IS NULL OR d.recurring = :recurring)")
    Page<InfrastructureDefect> searchDefects(
        @Param("projectId") String projectId,
        @Param("vendorId") String vendorId,
        @Param("category") DefectCategory category,
        @Param("status") DefectStatus status,
        @Param("recurring") Boolean recurring,
        Pageable pageable
    );

    @Query("SELECT d FROM InfrastructureDefect d WHERE d.project.id = :projectId AND d.category = :category AND d.id <> :excludeId")
    List<InfrastructureDefect> findPotentialRecurrenceCandidates(
        @Param("projectId") String projectId,
        @Param("category") DefectCategory category,
        @Param("excludeId") String excludeId
    );

    @Query(value = "SELECT nextval('defect_code_seq')", nativeQuery = true)
    Long getNextDefectSeq();
}
