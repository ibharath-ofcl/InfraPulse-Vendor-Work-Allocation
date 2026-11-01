package com.infrapulse.modules.intelligence.defect.repository;

import com.infrapulse.modules.intelligence.defect.entity.DefectHistoryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefectHistoryEventRepository extends JpaRepository<DefectHistoryEvent, String> {

    List<DefectHistoryEvent> findByDefectIdOrderByCreatedAtAsc(String defectId);
}
