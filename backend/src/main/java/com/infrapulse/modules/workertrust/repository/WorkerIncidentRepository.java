package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerIncident;
import com.infrapulse.modules.workertrust.enums.IncidentSeverity;
import com.infrapulse.modules.workertrust.enums.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerIncidentRepository extends JpaRepository<WorkerIncident, String> {

    Optional<WorkerIncident> findByIncidentReference(String incidentReference);

    @Query(value = "SELECT nextval('worker_incident_seq')", nativeQuery = true)
    Long getNextIncidentSequence();

    List<WorkerIncident> findByProjectId(String projectId);

    List<WorkerIncident> findByWorkerId(String workerId);

    @Query("SELECT wi FROM WorkerIncident wi " +
           "WHERE (:status IS NULL OR wi.incidentStatus = :status) " +
           "AND (:severity IS NULL OR wi.severity = :severity) " +
           "AND (:projectId IS NULL OR wi.project.id = :projectId) " +
           "ORDER BY wi.reportedAt DESC")
    Page<WorkerIncident> findAllWithFilters(
        @Param("status") IncidentStatus status,
        @Param("severity") IncidentSeverity severity,
        @Param("projectId") String projectId,
        Pageable pageable
    );

    long countByIncidentStatus(IncidentStatus status);

    long countBySeverity(IncidentSeverity severity);
}

