package com.infrapulse.modules.workertrust;

import com.infrapulse.common.audit.AuditService;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.model.UserStatus;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.workertrust.dto.SiteAccessScanResult;
import com.infrapulse.modules.workertrust.dto.SiteCheckInRequest;
import com.infrapulse.modules.workertrust.dto.SiteCheckOutRequest;
import com.infrapulse.modules.workertrust.entity.*;
import com.infrapulse.modules.workertrust.enums.*;
import com.infrapulse.modules.workertrust.repository.*;
import com.infrapulse.modules.workertrust.service.WorkerService;
import com.infrapulse.modules.workertrust.service.WorkerSiteAccessService;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkerSiteAccessServiceTest {

    @Mock private WorkerRepository workerRepository;
    @Mock private WorkerVendorAssociationRepository associationRepository;
    @Mock private WorkerProjectAssignmentRepository assignmentRepository;
    @Mock private WorkerCertificationRepository certificationRepository;
    @Mock private WorkerQrCredentialRepository qrCredentialRepository;
    @Mock private WorkerSiteAccessRepository siteAccessRepository;
    @Mock private WorkerAccessSuspensionRepository suspensionRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private WorkZoneRepository workZoneRepository;
    @Mock private WorkerService workerService;
    @Mock private AuditService auditService;

    @InjectMocks
    private WorkerSiteAccessService siteAccessService;

    private User gateOfficer;
    private Worker approvedWorker;
    private Project project;
    private WorkZone zone;
    private Vendor vendor;

    @BeforeEach
    void setUp() {
        gateOfficer = new User("officer-1", "Security Officer", "field@infrapulse.gov.in", "hash", "+919999911111", UserRole.FIELD_ENGINEER, UserStatus.ACTIVE);
        
        approvedWorker = new Worker();
        approvedWorker.setId("worker-1");
        approvedWorker.setWorkerCode("INF-WRK-2026-000001");
        approvedWorker.setFullName("Ramesh Kumar");
        approvedWorker.setCurrentStatus(WorkerStatus.APPROVED);

        project = new Project();
        project.setId("proj-1");
        project.setProjectCode("BLR-METRO-01");
        project.setProjectName("Bangalore Metro Utility Corridor");

        zone = new WorkZone();
        zone.setId("zone-1");
        zone.setZoneCode("WZ-IND-01");
        zone.setZoneName("Indiranagar 100ft Road");
        zone.setProject(project);

        vendor = new Vendor();
        vendor.setId("vendor-1");
        vendor.setCompanyName("Apex Infrastructure Ltd");
    }

    @Test
    @DisplayName("Should grant site access when worker is approved, has active assignment, and valid certifications")
    void testCheckIn_AllowEntry() {
        SiteCheckInRequest request = new SiteCheckInRequest("INF-WRK-2026-000001", "proj-1", "zone-1", "GATE-01");

        when(projectRepository.findById("proj-1")).thenReturn(Optional.of(project));
        when(workZoneRepository.findById("zone-1")).thenReturn(Optional.of(zone));
        when(workerRepository.findByWorkerCode("INF-WRK-2026-000001")).thenReturn(Optional.of(approvedWorker));
        when(suspensionRepository.existsByWorkerIdAndSuspensionStatus("worker-1", SuspensionStatus.ACTIVE)).thenReturn(false);

        WorkerProjectAssignment assignment = new WorkerProjectAssignment(
            approvedWorker, project, zone, vendor, LocalDate.now().minusDays(1), LocalDate.now().plusDays(10), "MASON", gateOfficer
        );
        when(assignmentRepository.findActiveAssignmentForWorkerAndProject("worker-1", "proj-1", LocalDate.now()))
            .thenReturn(Optional.of(assignment));

        when(certificationRepository.findByWorkerId("worker-1")).thenReturn(List.of());
        when(siteAccessRepository.findFirstByWorkerIdAndExitTimeIsNullAndAccessStatus("worker-1", SiteAccessStatus.ALLOW_ENTRY))
            .thenReturn(Optional.empty());

        when(siteAccessRepository.save(any(WorkerSiteAccess.class))).thenAnswer(i -> {
            WorkerSiteAccess sa = i.getArgument(0);
            sa.setId("access-123");
            return sa;
        });

        SiteAccessScanResult result = siteAccessService.checkIn(request, gateOfficer);

        assertTrue(result.allowed());
        assertEquals(SiteAccessStatus.ALLOW_ENTRY, result.accessStatus());
        assertNull(result.blockingReason());
        assertEquals(WorkerStatus.ACTIVE_ON_SITE, approvedWorker.getCurrentStatus());

        verify(siteAccessRepository, times(1)).save(any(WorkerSiteAccess.class));
    }

    @Test
    @DisplayName("Should block site access if worker is suspended")
    void testCheckIn_SuspendedWorker_Blocked() {
        SiteCheckInRequest request = new SiteCheckInRequest("INF-WRK-2026-000001", "proj-1", null, "GATE-01");

        when(projectRepository.findById("proj-1")).thenReturn(Optional.of(project));
        when(workerRepository.findByWorkerCode("INF-WRK-2026-000001")).thenReturn(Optional.of(approvedWorker));
        when(suspensionRepository.existsByWorkerIdAndSuspensionStatus("worker-1", SuspensionStatus.ACTIVE)).thenReturn(true);

        SiteAccessScanResult result = siteAccessService.checkIn(request, gateOfficer);

        assertFalse(result.allowed());
        assertEquals(SiteAccessStatus.BLOCK_ENTRY, result.accessStatus());
        assertEquals(SiteBlockingReason.WORKER_SUSPENDED, result.blockingReason());
    }

    @Test
    @DisplayName("Should block site access if worker has no active project assignment")
    void testCheckIn_NoActiveAssignment_Blocked() {
        SiteCheckInRequest request = new SiteCheckInRequest("INF-WRK-2026-000001", "proj-1", null, "GATE-01");

        when(projectRepository.findById("proj-1")).thenReturn(Optional.of(project));
        when(workerRepository.findByWorkerCode("INF-WRK-2026-000001")).thenReturn(Optional.of(approvedWorker));
        when(suspensionRepository.existsByWorkerIdAndSuspensionStatus("worker-1", SuspensionStatus.ACTIVE)).thenReturn(false);
        when(assignmentRepository.findActiveAssignmentForWorkerAndProject("worker-1", "proj-1", LocalDate.now()))
            .thenReturn(Optional.empty());

        SiteAccessScanResult result = siteAccessService.checkIn(request, gateOfficer);

        assertFalse(result.allowed());
        assertEquals(SiteAccessStatus.BLOCK_ENTRY, result.accessStatus());
        assertEquals(SiteBlockingReason.NO_ACTIVE_ASSIGNMENT, result.blockingReason());
    }

    @Test
    @DisplayName("Should successfully record site check-out and update worker status")
    void testCheckOut_Success() {
        WorkerSiteAccess activeAccess = new WorkerSiteAccess(
            approvedWorker, project, zone, Instant.now().minusSeconds(3600), SiteAccessStatus.ALLOW_ENTRY, gateOfficer, null
        );
        activeAccess.setId("access-123");

        when(siteAccessRepository.findById("access-123")).thenReturn(Optional.of(activeAccess));
        when(siteAccessRepository.save(any(WorkerSiteAccess.class))).thenReturn(activeAccess);
        when(assignmentRepository.findActiveAssignmentForWorker("worker-1", LocalDate.now()))
            .thenReturn(Optional.empty());

        SiteAccessScanResult result = siteAccessService.checkOut(new SiteCheckOutRequest("access-123"), gateOfficer);

        assertTrue(result.allowed());
        assertNotNull(activeAccess.getExitTime());
        assertEquals(WorkerStatus.APPROVED, approvedWorker.getCurrentStatus());
    }
}
