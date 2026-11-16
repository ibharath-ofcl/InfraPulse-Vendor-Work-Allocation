package com.infrapulse.modules.intelligence.risk.repository;

import com.infrapulse.modules.intelligence.risk.entity.ProjectRiskAlert;
import com.infrapulse.modules.intelligence.risk.model.RiskAlertStatus;
import com.infrapulse.modules.intelligence.risk.model.RiskCategory;
import com.infrapulse.modules.intelligence.risk.model.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRiskAlertRepository extends JpaRepository<ProjectRiskAlert, String> {

    List<ProjectRiskAlert> findByProjectIdAndAlertStatus(String projectId, RiskAlertStatus status);

    List<ProjectRiskAlert> findByProjectId(String projectId);

    Page<ProjectRiskAlert> findByProjectId(String projectId, Pageable pageable);

    Page<ProjectRiskAlert> findByVendorId(String vendorId, Pageable pageable);

    long countByProjectIdAndAlertStatus(String projectId, RiskAlertStatus status);

    long countByProjectIdAndRiskLevelAndAlertStatus(String projectId, RiskLevel riskLevel, RiskAlertStatus status);

    long countByAlertStatus(RiskAlertStatus status);

    long countByRiskLevelAndAlertStatus(RiskLevel riskLevel, RiskAlertStatus status);

    @Query("SELECT a FROM ProjectRiskAlert a WHERE (:projectId IS NULL OR a.project.id = :projectId) " +
           "AND (:category IS NULL OR a.riskCategory = :category) " +
           "AND (:level IS NULL OR a.riskLevel = :level) " +
           "AND (:status IS NULL OR a.alertStatus = :status)")
    Page<ProjectRiskAlert> searchAlerts(
        @Param("projectId") String projectId,
        @Param("category") RiskCategory category,
        @Param("level") RiskLevel level,
        @Param("status") RiskAlertStatus status,
        Pageable pageable
    );

    @Query(value = "SELECT nextval('risk_alert_seq')", nativeQuery = true)
    Long getNextAlertSeq();
}

