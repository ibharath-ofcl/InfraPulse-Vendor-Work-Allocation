package com.infrapulse.modules.intelligence.contract.repository;

import com.infrapulse.modules.intelligence.contract.entity.ContractRequirement;
import com.infrapulse.modules.intelligence.contract.model.RequirementApprovalStatus;
import com.infrapulse.modules.intelligence.contract.model.RequirementCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRequirementRepository extends JpaRepository<ContractRequirement, String> {

    Optional<ContractRequirement> findByRequirementCode(String requirementCode);

    List<ContractRequirement> findByContractId(String contractId);

    List<ContractRequirement> findByProjectId(String projectId);

    Page<ContractRequirement> findByProjectId(String projectId, Pageable pageable);

    Page<ContractRequirement> findByProjectIdAndApprovalStatus(String projectId, RequirementApprovalStatus status, Pageable pageable);

    List<ContractRequirement> findByProjectIdAndWorkPackage(String projectId, String workPackage);

    long countByProjectId(String projectId);

    long countByProjectIdAndApprovalStatus(String projectId, RequirementApprovalStatus status);

    @Query("SELECT r FROM ContractRequirement r WHERE (:projectId IS NULL OR r.project.id = :projectId) " +
           "AND (:category IS NULL OR r.category = :category) " +
           "AND (:status IS NULL OR r.approvalStatus = :status)")
    Page<ContractRequirement> searchRequirements(
        @Param("projectId") String projectId,
        @Param("category") RequirementCategory category,
        @Param("status") RequirementApprovalStatus status,
        Pageable pageable
    );

    @Query(value = "SELECT nextval('requirement_code_seq')", nativeQuery = true)
    Long getNextRequirementSeq();
}

