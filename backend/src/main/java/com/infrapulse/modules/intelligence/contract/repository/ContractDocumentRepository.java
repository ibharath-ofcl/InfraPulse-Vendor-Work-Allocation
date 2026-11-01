package com.infrapulse.modules.intelligence.contract.repository;

import com.infrapulse.modules.intelligence.contract.entity.ContractDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractDocumentRepository extends JpaRepository<ContractDocument, String> {

    List<ContractDocument> findByContractId(String contractId);

    Optional<ContractDocument> findBySha256Hash(String sha256Hash);
}
