package com.infrapulse.modules.workertrust.service;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workertrust.dto.WorkforceAnalyticsResponse;
import com.infrapulse.modules.workertrust.dto.WorkforceAnalyticsResponse.DailyAttendanceMetric;
import com.infrapulse.modules.workertrust.entity.Worker;
import com.infrapulse.modules.workertrust.entity.WorkerProjectAssignment;
import com.infrapulse.modules.workertrust.entity.WorkerSiteAccess;
import com.infrapulse.modules.workertrust.entity.WorkerVendorAssociation;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkerAnalyticsService {

    private final WorkerRepository workerRepository;
    private final WorkerVendorAssociationRepository associationRepository;
    private final WorkerProjectAssignmentRepository assignmentRepository;
    private final WorkerCertificationRepository certificationRepository;
    private final WorkerSiteAccessRepository siteAccessRepository;
    private final WorkerIncidentRepository incidentRepository;
    private final WorkerAccessSuspensionRepository suspensionRepository;
    private final VendorRepository vendorRepository;
    private final ProjectRepository projectRepository;

    public WorkerAnalyticsService(
        WorkerRepository workerRepository,
        WorkerVendorAssociationRepository associationRepository,
        WorkerProjectAssignmentRepository assignmentRepository,
        WorkerCertificationRepository certificationRepository,
        WorkerSiteAccessRepository siteAccessRepository,
        WorkerIncidentRepository incidentRepository,
        WorkerAccessSuspensionRepository suspensionRepository,
        VendorRepository vendorRepository,
        ProjectRepository projectRepository
    ) {
        this.workerRepository = workerRepository;
        this.associationRepository = associationRepository;
        this.assignmentRepository = assignmentRepository;
        this.certificationRepository = certificationRepository;
        this.siteAccessRepository = siteAccessRepository;
        this.incidentRepository = incidentRepository;
        this.suspensionRepository = suspensionRepository;
        this.vendorRepository = vendorRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public WorkforceAnalyticsResponse getAnalytics(String projectId, String vendorId, User currentUser) {
        List<Worker> allWorkers = workerRepository.findAll();

        long totalRegistered = allWorkers.size();
        long approved = allWorkers.stream().filter(w -> w.getCurrentStatus() == WorkerStatus.APPROVED).count();
        long pending = allWorkers.stream().filter(w -> w.getCurrentStatus() == WorkerStatus.PENDING_REVIEW).count();
        long underVerif = allWorkers.stream().filter(w -> w.getCurrentStatus() == WorkerStatus.UNDER_VERIFICATION).count();
        long rejected = allWorkers.stream().filter(w -> w.getCurrentStatus() == WorkerStatus.REJECTED).count();
        long suspended = allWorkers.stream().filter(w -> w.getCurrentStatus() == WorkerStatus.SUSPENDED).count();
        long activeOnSite = siteAccessRepository.countCurrentlyOnSite();
        long activeAssignments = assignmentRepository.countByAssignmentStatus(AssignmentStatus.ACTIVE);

        LocalDate today = LocalDate.now();
        long expiredCerts = certificationRepository.countExpiredCertifications(today);
        long expiring30Days = certificationRepository.countExpiringWithinDays(today, today.plusDays(30));
        long totalCerts = certificationRepository.count();
        long verifiedCerts = certificationRepository.countByVerificationStatus(CertificationStatus.VERIFIED);

        double complianceRate = totalCerts > 0
            ? Math.round(((double) (verifiedCerts - expiredCerts) / (double) totalCerts) * 1000.0) / 10.0
            : 100.0;
        if (complianceRate < 0.0) complianceRate = 0.0;

        long openIncidents = incidentRepository.countByIncidentStatus(IncidentStatus.REPORTED) +
                             incidentRepository.countByIncidentStatus(IncidentStatus.UNDER_INVESTIGATION) +
                             incidentRepository.countByIncidentStatus(IncidentStatus.ACTION_REQUIRED);
        long totalIncidents = incidentRepository.count();

        // Status breakdown
        Map<String, Long> byStatus = allWorkers.stream()
            .collect(Collectors.groupingBy(w -> w.getCurrentStatus().name(), Collectors.counting()));

        // Vendor breakdown
        List<WorkerVendorAssociation> associations = associationRepository.findAll();
        Map<String, Long> byVendor = associations.stream()
            .collect(Collectors.groupingBy(a -> a.getVendor().getCompanyName(), Collectors.counting()));

        // Project breakdown
        List<WorkerProjectAssignment> assignments = assignmentRepository.findAll();
        Map<String, Long> byProject = assignments.stream()
            .filter(a -> a.getAssignmentStatus() == AssignmentStatus.ACTIVE)
            .collect(Collectors.groupingBy(a -> a.getProject().getProjectName(), Collectors.counting()));

        // 7-day attendance trend
        List<DailyAttendanceMetric> trend = new ArrayList<>();
        List<WorkerSiteAccess> allSiteAccess = siteAccessRepository.findAll();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            long count = allSiteAccess.stream().filter(sa -> {
                if (sa.getAccessStatus() != SiteAccessStatus.ALLOW_ENTRY) return false;
                LocalDate saDate = sa.getEntryTime().atZone(ZoneOffset.UTC).toLocalDate();
                return saDate.equals(d);
            }).count();
            trend.add(new DailyAttendanceMetric(d.toString(), count));
        }

        return new WorkforceAnalyticsResponse(
            totalRegistered,
            approved,
            pending,
            underVerif,
            rejected,
            suspended,
            activeOnSite,
            activeAssignments,
            complianceRate,
            expiredCerts,
            expiring30Days,
            openIncidents,
            totalIncidents,
            byStatus,
            byVendor,
            byProject,
            trend
        );
    }
}

