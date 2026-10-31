package com.infrapulse.modules.humanreview.repository;

import com.infrapulse.modules.humanreview.entity.PhysicalMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhysicalMeasurementRepository extends JpaRepository<PhysicalMeasurement, String> {

    Optional<PhysicalMeasurement> findByMeasurementCode(String measurementCode);

    List<PhysicalMeasurement> findByAssessmentIdOrderByMeasuredAtDesc(String assessmentId);

    List<PhysicalMeasurement> findByFindingId(String findingId);

    @Query(value = "SELECT nextval('measurement_seq')", nativeQuery = true)
    Long getNextMeasurementSequence();
}
