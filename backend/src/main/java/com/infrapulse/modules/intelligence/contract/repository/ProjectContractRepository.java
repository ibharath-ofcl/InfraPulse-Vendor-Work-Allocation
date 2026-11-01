package com.infrapulse.modules.intelligence.contract.repository;

import com.infrapulse.modules.intelligence.contract.entity.ProjectContract;
import com.infrapulse.modules.intelligence.contract.model.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectContractRepository extends JpaRepository<ProjectContract, String> {

    Optional<ProjectContract> findByContractCode(String contractCode);

    List<ProjectContract> findByProjectId(String projectId);

    Page<ProjectContract> findByProjectId(String projectId, Pageable pageable);

    Page<ProjectContract> findByContractorId(String contractorId, Pageable pageable);

    Page<ProjectContract> findByStatus(ContractStatus status, Pageable pageable);

    @Query(value = "SELECT nextval('contract_code_seq')", nativeQuery = true)
    Long getNextContractSeq();
}
