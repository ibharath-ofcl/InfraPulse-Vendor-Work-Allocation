package com.infrapulse.modules.workertrust.repository;

import com.infrapulse.modules.workertrust.entity.WorkerProjectAssignment;
import com.infrapulse.modules.workertrust.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerProjectAssignmentRepository extends JpaRepository<WorkerProjectAssignment, String> {

    List<WorkerProjectAssignment> findByWorkerId(String workerId);

    List<WorkerProjectAssignment> findByProjectId(String projectId);

    List<WorkerProjectAssignment> findByWorkZoneId(String workZoneId);

    List<WorkerProjectAssignment> findByVendorId(String vendorId);

    Optional<WorkerProjectAssignment> findFirstByWorkerIdAndAssignmentStatus(String workerId, AssignmentStatus status);

    @Query("SELECT wpa FROM WorkerProjectAssignment wpa " +
           "WHERE wpa.worker.id = :workerId " +
           "AND wpa.project.id = :projectId " +
           "AND wpa.assignmentStatus = 'ACTIVE' " +
           "AND :date BETWEEN wpa.startDate AND wpa.endDate")
    Optional<WorkerProjectAssignment> findActiveAssignmentForWorkerAndProject(
        @Param("workerId") String workerId,
        @Param("projectId") String projectId,
        @Param("date") LocalDate date
    );

    @Query("SELECT wpa FROM WorkerProjectAssignment wpa " +
           "WHERE wpa.worker.id = :workerId " +
           "AND wpa.assignmentStatus = 'ACTIVE' " +
           "AND :date BETWEEN wpa.startDate AND wpa.endDate")
    Optional<WorkerProjectAssignment> findActiveAssignmentForWorker(
        @Param("workerId") String workerId,
        @Param("date") LocalDate date
    );

    long countByAssignmentStatus(AssignmentStatus status);
}

