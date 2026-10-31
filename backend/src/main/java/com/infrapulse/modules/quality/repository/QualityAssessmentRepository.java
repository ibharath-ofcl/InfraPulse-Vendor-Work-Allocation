package com.infrapulse.modules.quality.repository;

import com.infrapulse.modules.quality.entity.QualityAssessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QualityAssessmentRepository extends JpaRepository<QualityAssessment, String> {

    Optional<QualityAssessment> findByAssessmentCode(String assessmentCode);

    List<QualityAssessment> findByAssignmentIdOrderByCreatedAtDesc(String assignmentId);

    Optional<QualityAssessment> findFirstByAssignmentIdOrderByRevisionNumberDesc(String assignmentId);

    Page<QualityAssessment> findByAssignmentIdOrderByCreatedAtDesc(String assignmentId, Pageable pageable);

    @Query(value = "SELECT nextval('quality_assessment_seq')", nativeQuery = true)
    Long getNextAssessmentSequence();
}
