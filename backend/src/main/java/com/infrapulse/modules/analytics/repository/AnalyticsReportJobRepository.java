package com.infrapulse.modules.analytics.repository;

import com.infrapulse.modules.analytics.entity.AnalyticsReportJob;
import com.infrapulse.modules.analytics.enums.ReportType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnalyticsReportJobRepository extends JpaRepository<AnalyticsReportJob, String> {

    Optional<AnalyticsReportJob> findByReportCode(String reportCode);

    Page<AnalyticsReportJob> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AnalyticsReportJob> findByRequestedByIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<AnalyticsReportJob> findByReportTypeOrderByCreatedAtDesc(ReportType reportType, Pageable pageable);
}
