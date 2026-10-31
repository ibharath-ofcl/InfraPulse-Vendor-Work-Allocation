package com.infrapulse.modules.project.repository;

import com.infrapulse.modules.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String>, JpaSpecificationExecutor<Project> {

    Optional<Project> findByProjectCode(String projectCode);

    boolean existsByProjectCode(String projectCode);

    @Query("SELECT p FROM Project p WHERE p.projectManager.id = :managerId")
    Page<Project> findByProjectManagerId(@Param("managerId") String managerId, Pageable pageable);

    @Query("""
        SELECT DISTINCT p FROM Project p 
        JOIN ProjectVendor pv ON pv.project.id = p.id 
        WHERE pv.vendor.user.id = :userId AND pv.associationStatus = 'ACTIVE'
    """)
    Page<Project> findProjectsForVendorUserId(@Param("userId") String userId, Pageable pageable);

    @Query("""
        SELECT COUNT(p) > 0 FROM Project p 
        JOIN ProjectVendor pv ON pv.project.id = p.id 
        WHERE p.id = :projectId AND pv.vendor.user.id = :userId AND pv.associationStatus = 'ACTIVE'
    """)
    boolean isVendorAssociatedWithProject(@Param("projectId") String projectId, @Param("userId") String userId);
}
