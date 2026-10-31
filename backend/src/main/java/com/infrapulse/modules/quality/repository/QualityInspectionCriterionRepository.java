package com.infrapulse.modules.quality.repository;

import com.infrapulse.modules.quality.entity.QualityInspectionCriterion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QualityInspectionCriterionRepository extends JpaRepository<QualityInspectionCriterion, String> {
    List<QualityInspectionCriterion> findByTemplateIdOrderByOrderIndexAsc(String templateId);
    Optional<QualityInspectionCriterion> findByTemplateIdAndCriterionCode(String templateId, String criterionCode);
}
