package com.infrapulse.modules.evidence.repository;

import com.infrapulse.modules.evidence.entity.WorkEvidence;
import com.infrapulse.modules.evidence.model.EvidenceCategory;
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
public interface WorkEvidenceRepository extends JpaRepository<WorkEvidence, String>, JpaSpecificationExecutor<WorkEvidence> {

    Optional<WorkEvidence> findByEvidenceCode(String evidenceCode);

    Optional<WorkEvidence> findByIdAndIsDeletedFalse(String id);

    Page<WorkEvidence> findByWorkAssignmentIdAndIsDeletedFalseOrderByUploadedAtDesc(String assignmentId, Pageable pageable);

    Page<WorkEvidence> findByWorkAssignmentIdAndEvidenceCategoryAndIsDeletedFalseOrderByUploadedAtDesc(
            String assignmentId, EvidenceCategory category, Pageable pageable);

    List<WorkEvidence> findByWorkAssignmentIdAndIsDeletedFalse(String assignmentId);

    long countByWorkAssignmentIdAndIsDeletedFalse(String assignmentId);

    Page<WorkEvidence> findByProjectIdAndIsDeletedFalseOrderByUploadedAtDesc(String projectId, Pageable pageable);

    Page<WorkEvidence> findByVendorIdAndIsDeletedFalseOrderByUploadedAtDesc(String vendorId, Pageable pageable);

    @Query(value = "SELECT nextval('work_evidence_seq')", nativeQuery = true)
    Long getNextEvidenceSequence();
}
