package com.infrapulse.modules.intelligence.risk.repository;

import com.infrapulse.modules.intelligence.risk.entity.ProjectRiskAssessment;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRiskAssessmentRepository extends JpaRepository<ProjectRiskAssessment, String> {

    Optional<ProjectRiskAssessment> findByAssessmentCode(String assessmentCode);

    List<ProjectRiskAssessment> findByProjectIdOrderByEvaluatedAtDesc(String projectId);

    Optional<ProjectRiskAssessment> findFirstByProjectIdOrderByEvaluatedAtDesc(String projectId);

    Page<ProjectRiskAssessment> findByOverallRiskLevel(RiskLevel level, Pageable pageable);

    @Query(value = "SELECT nextval('risk_assessment_seq')", nativeQuery = true)
    Long getNextAssessmentSeq();
}
