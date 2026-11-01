package com.infrapulse.modules.workertrust.dto;

import java.util.List;
import java.util.Map;

public record WorkforceAnalyticsResponse(
    long totalRegisteredWorkers,
    long approvedWorkers,
    long pendingVerification,
    long underVerification,
    long rejectedWorkers,
    long suspendedWorkers,
    long activeOnSiteWorkers,
    long activeAssignmentsCount,
    double certificationComplianceRate,
    long expiredCertificationsCount,
    long expiringWithin30DaysCertificationsCount,
    long openSafetyIncidents,
    long totalSafetyIncidents,
    Map<String, Long> workersByStatus,
    Map<String, Long> workersByVendor,
    Map<String, Long> workersByProject,
    List<DailyAttendanceMetric> dailyAttendanceTrend
) {
    public record DailyAttendanceMetric(
        String date,
        long count
    ) {}
}

