package com.infrapulse.modules.workassignment.repository;

import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkAssignmentRepository extends JpaRepository<WorkAssignment, String>, JpaSpecificationExecutor<WorkAssignment> {

    Optional<WorkAssignment> findByAssignmentCode(String assignmentCode);

    boolean existsByAssignmentCode(String assignmentCode);

    List<WorkAssignment> findByVendorId(String vendorId);

    List<WorkAssignment> findByProjectId(String projectId);

    List<WorkAssignment> findByWorkZoneId(String workZoneId);

    long countByWorkZoneIdAndStatusIn(String workZoneId, Collection<AssignmentStatus> statuses);

    long countByVendorIdAndStatus(String vendorId, AssignmentStatus status);

    long countByProjectId(String projectId);

    List<WorkAssignment> findByProjectIdAndWorkZoneIdAndWorkType(
        String projectId, 
        String workZoneId, 
        com.infrapulse.modules.workassignment.enums.WorkType workType
    );

    List<WorkAssignment> findByProjectIdAndWorkZoneId(String projectId, String workZoneId);

    @Query("""
        SELECT a FROM WorkAssignment a 
        WHERE a.project.id = :projectId 
          AND a.workZone.id = :workZoneId 
          AND a.status IN :activeStatuses
    """)
    List<WorkAssignment> findActiveInZone(
        @org.springframework.data.repository.query.Param("projectId") String projectId,
        @org.springframework.data.repository.query.Param("workZoneId") String workZoneId,
        @org.springframework.data.repository.query.Param("activeStatuses") Collection<AssignmentStatus> activeStatuses
    );

    @Query(value = "SELECT nextval('work_assignment_seq')", nativeQuery = true)
    Long getNextAssignmentSequence();
}
