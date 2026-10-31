package com.infrapulse.modules.workdependency.repository;

import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workdependency.entity.WorkTypeDependency;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkTypeDependencyRepository extends JpaRepository<WorkTypeDependency, String> {

    List<WorkTypeDependency> findBySuccessorWorkTypeAndIsActiveTrueOrderByPriorityAsc(WorkType successorWorkType);

    @Query("""
        SELECT d FROM WorkTypeDependency d 
        LEFT JOIN d.project p
        WHERE d.successorWorkType = :successorWorkType 
          AND d.isActive = true 
          AND (p.id = :projectId OR p.id IS NULL)
        ORDER BY d.priority ASC
    """)
    List<WorkTypeDependency> findApplicableRules(
        @Param("projectId") String projectId, 
        @Param("successorWorkType") WorkType successorWorkType
    );

    @Query("""
        SELECT d FROM WorkTypeDependency d 
        LEFT JOIN d.project p
        WHERE d.isActive = true 
          AND (p.id = :projectId OR p.id IS NULL)
        ORDER BY d.priority ASC
    """)
    List<WorkTypeDependency> findAllApplicableRules(@Param("projectId") String projectId);

    Page<WorkTypeDependency> findByProjectId(String projectId, Pageable pageable);

    Page<WorkTypeDependency> findByIsActive(boolean isActive, Pageable pageable);

    boolean existsBySuccessorWorkTypeAndPredecessorWorkTypeAndProjectId(
        WorkType successorWorkType,
        WorkType predecessorWorkType,
        String projectId
    );
}
