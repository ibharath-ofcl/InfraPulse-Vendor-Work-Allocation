package com.infrapulse.common.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface AuditChainHeadRepository extends JpaRepository<AuditChainHead, String> {

    Optional<AuditChainHead> findByChainScope(String chainScope);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM AuditChainHead h WHERE h.chainScope = :chainScope")
    Optional<AuditChainHead> findByChainScopeWithLock(@Param("chainScope") String chainScope);
}
