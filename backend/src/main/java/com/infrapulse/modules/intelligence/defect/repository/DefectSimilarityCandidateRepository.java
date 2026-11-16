package com.infrapulse.modules.intelligence.defect.repository;

import com.infrapulse.modules.intelligence.defect.entity.DefectSimilarityCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefectSimilarityCandidateRepository extends JpaRepository<DefectSimilarityCandidate, String> {

    List<DefectSimilarityCandidate> findByDefectIdOrderBySimilarityScoreDesc(String defectId);

    List<DefectSimilarityCandidate> findByCandidateDefectId(String candidateDefectId);
}

