package com.infrapulse.modules.intelligence.contract.repository;

import com.infrapulse.modules.intelligence.contract.entity.ContractRequirementEvidence;
import com.infrapulse.modules.intelligence.contract.model.RequirementEvidenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRequirementEvidenceRepository extends JpaRepository<ContractRequirementEvidence, String> {

    List<ContractRequirementEvidence> findByRequirementId(String requirementId);

    List<ContractRequirementEvidence> findByEvidenceId(String evidenceId);

    List<ContractRequirementEvidence> findByAssignmentId(String assignmentId);

    Optional<ContractRequirementEvidence> findByRequirementIdAndEvidenceId(String requirementId, String evidenceId);

    @Query("SELECT COUNT(e) FROM ContractRequirementEvidence e WHERE e.requirement.project.id = :projectId AND e.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") String projectId, @Param("status") RequirementEvidenceStatus status);

    @Query("SELECT COUNT(e) FROM ContractRequirementEvidence e WHERE e.requirement.project.id = :projectId AND e.status IN ('VERIFIED', 'WAIVED_WITH_AUTHORIZATION')")
    long countCompliantByProjectId(@Param("projectId") String projectId);

    @Query("SELECT COUNT(e) FROM ContractRequirementEvidence e WHERE e.requirement.project.id = :projectId")
    long countTotalByProjectId(@Param("projectId") String projectId);
}

