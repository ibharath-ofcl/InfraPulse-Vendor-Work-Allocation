package com.infrapulse.modules.finance.repository;

import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.enums.MilestoneStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, String>, JpaSpecificationExecutor<ProjectMilestone> {

    Optional<ProjectMilestone> findByMilestoneCode(String milestoneCode);

    List<ProjectMilestone> findByProjectId(String projectId);

    List<ProjectMilestone> findByAgreementId(String agreementId);

    List<ProjectMilestone> findByVendorId(String vendorId);

    Page<ProjectMilestone> findByProjectId(String projectId, Pageable pageable);

    Page<ProjectMilestone> findByVendorId(String vendorId, Pageable pageable);

    Page<ProjectMilestone> findByStatus(MilestoneStatus status, Pageable pageable);

    List<ProjectMilestone> findByProjectIdOrderBySequenceNumberAsc(String projectId);

    List<ProjectMilestone> findByAgreementIdOrderBySequenceNumberAsc(String agreementId);

    @Query("""
        SELECT COUNT(m) > 0 FROM ProjectMilestone m
        WHERE m.agreement.id = :agreementId AND m.sequenceNumber < :seq AND m.status != 'PAID' AND m.status != 'PAYMENT_APPROVED'
    """)
    boolean hasUnsatisfiedPredecessors(@Param("agreementId") String agreementId, @Param("seq") int seq);
}
