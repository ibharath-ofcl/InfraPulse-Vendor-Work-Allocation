package com.infrapulse.modules.auth.repository;

import com.infrapulse.modules.auth.model.AuthenticationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuthenticationAuditRepository extends JpaRepository<AuthenticationAudit, Long> {
    List<AuthenticationAudit> findTop50ByOrderByEventTimestampDesc();
    List<AuthenticationAudit> findByUserIdOrderByEventTimestampDesc(String userId);
}
