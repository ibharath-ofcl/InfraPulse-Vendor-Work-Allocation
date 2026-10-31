package com.infrapulse.modules.quality.repository;

import com.infrapulse.modules.quality.entity.QualityInspectionTemplate;
import com.infrapulse.modules.workassignment.enums.WorkType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QualityInspectionTemplateRepository extends JpaRepository<QualityInspectionTemplate, String> {
    Optional<QualityInspectionTemplate> findByTemplateCode(String templateCode);
    List<QualityInspectionTemplate> findByWorkTypeAndIsActiveTrue(WorkType workType);
    Optional<QualityInspectionTemplate> findFirstByWorkTypeAndIsActiveTrueOrderByVersionDesc(WorkType workType);
}
