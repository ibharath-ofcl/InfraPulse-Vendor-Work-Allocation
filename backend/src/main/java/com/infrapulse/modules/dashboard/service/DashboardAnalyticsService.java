package com.infrapulse.modules.dashboard.service;

import com.infrapulse.common.audit.AuditEvent;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.auth.repository.UserRepository;
import com.infrapulse.modules.dashboard.dto.*;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.vendor.entity.Vendor;
import com.infrapulse.modules.vendor.repository.VendorRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.enums.AssignmentStatus;
import com.infrapulse.modules.workassignment.enums.ReleaseStatus;
import com.infrapulse.modules.workassignment.enums.WorkType;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import com.infrapulse.modules.workdependency.dto.BlockedDependencyDetail;
import com.infrapulse.modules.workdependency.service.WorkDependencyService;
import com.infrapulse.modules.workzone.entity.WorkZone;
import com.infrapulse.modules.workzone.repository.WorkZoneRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(DashboardAnalyticsService.class);

    private final WorkAssignmentRepository workAssignmentRepository;
    private final ProjectRepository projectRepository;
    private final WorkZoneRepository workZoneRepository;
    private final VendorRepository vendorRepository;
    private final AuditEventRepository auditEventRepository;
    private final UserRepository userRepository;
    private final WorkDependencyService workDependencyService;

    public DashboardAnalyticsService(
        WorkAssignmentRepository workAssignmentRepository,
        ProjectRepository projectRepository,
        WorkZoneRepository workZoneRepository,
        VendorRepository vendorRepository,
        AuditEventRepository auditEventRepository,
        UserRepository userRepository,
        WorkDependencyService workDependencyService
    ) {
        this.workAssignmentRepository = workAssignmentRepository;
        this.projectRepository = projectRepository;
        this.workZoneRepository = workZoneRepository;
        this.vendorRepository = vendorRepository;
        this.auditEventRepository = auditEventRepository;
        this.userRepository = userRepository;
        this.workDependencyService = workDependencyService;
    }

    /**
     * Builds role-based and filter-based specification for Work Assignments.
     */
    private Specification<WorkAssignment> buildAssignmentSpec(
        String projectId,
        String pincode,
        String workZoneId,
        String vendorId,
        WorkType workType,
        AssignmentStatus status,
        LocalDate startDate,
        LocalDate endDate,
        User currentUser
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Role Scoping
            if (currentUser != null) {
                if (currentUser.getRole() == UserRole.PROJECT_MANAGER) {
                    predicates.add(cb.equal(root.get("project").get("projectManager").get("id"), currentUser.getId()));
                } else if (currentUser.getRole() == UserRole.VENDOR) {
                    Optional<Vendor> vOpt = vendorRepository.findByUserId(currentUser.getId());
                    if (vOpt.isPresent()) {
                        predicates.add(cb.equal(root.get("vendor").get("id"), vOpt.get().getId()));
                    } else {
                        predicates.add(cb.disjunction());
                    }
                }
            }

            // 2. Query Filters
            if (projectId != null && !projectId.isBlank() && !"ALL".equalsIgnoreCase(projectId)) {
                predicates.add(cb.equal(root.get("project").get("id"), projectId.trim()));
            }

            if (pincode != null && !pincode.isBlank()) {
                predicates.add(cb.equal(root.get("workZone").get("pincode"), pincode.trim()));
            }

            if (workZoneId != null && !workZoneId.isBlank()) {
                predicates.add(cb.equal(root.get("workZone").get("id"), workZoneId.trim()));
            }

            if (vendorId != null && !vendorId.isBlank()) {
                predicates.add(cb.equal(root.get("vendor").get("id"), vendorId.trim()));
            }

            if (workType != null) {
                predicates.add(cb.equal(root.get("workType"), workType));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("plannedStartDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("plannedStartDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Resolves accessible projects for the current authenticated user.
     */
    private List<Project> getAccessibleProjects(User currentUser, String filterProjectId) {
        List<Project> allProjects;
        if (currentUser != null && currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            allProjects = projectRepository.findAll((root, q, cb) ->
                cb.equal(root.get("projectManager").get("id"), currentUser.getId())
            );
        } else if (currentUser != null && currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vOpt.isEmpty()) {
                return Collections.emptyList();
            }
            List<WorkAssignment> vendorAssignments = workAssignmentRepository.findByVendorId(vOpt.get().getId());
            Set<String> projectIds = vendorAssignments.stream()
                .map(a -> a.getProject().getId())
                .collect(Collectors.toSet());
            if (projectIds.isEmpty()) {
                return Collections.emptyList();
            }
            allProjects = projectRepository.findAllById(projectIds);
        } else {
            allProjects = projectRepository.findAll();
        }

        if (filterProjectId != null && !filterProjectId.isBlank() && !"ALL".equalsIgnoreCase(filterProjectId)) {
            return allProjects.stream()
                .filter(p -> p.getId().equals(filterProjectId.trim()))
                .toList();
        }
        return allProjects;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(
        String projectId,
        String pincode,
        String workZoneId,
        String vendorId,
        WorkType workType,
        LocalDate startDate,
        LocalDate endDate,
        User currentUser
    ) {
        Specification<WorkAssignment> baseSpec = buildAssignmentSpec(
            projectId, pincode, workZoneId, vendorId, workType, null, startDate, endDate, currentUser
        );

        long totalAssignments = workAssignmentRepository.count(baseSpec);

        Specification<WorkAssignment> activeSpec = baseSpec.and((root, q, cb) ->
            root.get("status").in(AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.IN_PROGRESS)
        );
        long activeAssignments = workAssignmentRepository.count(activeSpec);

        Specification<WorkAssignment> pendingSpec = baseSpec.and((root, q, cb) ->
            cb.equal(root.get("status"), AssignmentStatus.ASSIGNED)
        );
        long pendingAcceptance = workAssignmentRepository.count(pendingSpec);

        Specification<WorkAssignment> inProgressSpec = baseSpec.and((root, q, cb) ->
            cb.equal(root.get("status"), AssignmentStatus.IN_PROGRESS)
        );
        long inProgress = workAssignmentRepository.count(inProgressSpec);

        Specification<WorkAssignment> awaitingReviewSpec = baseSpec.and((root, q, cb) ->
            cb.equal(root.get("status"), AssignmentStatus.SUBMITTED_FOR_REVIEW)
        );
        long awaitingReview = workAssignmentRepository.count(awaitingReviewSpec);

        Specification<WorkAssignment> completedSpec = baseSpec.and((root, q, cb) ->
            cb.equal(root.get("status"), AssignmentStatus.COMPLETED)
        );
        long completedAssignments = workAssignmentRepository.count(completedSpec);

        // Calculate blocked and ready using Stage 6 dependency validation
        List<WorkAssignment> candidateAssignments = workAssignmentRepository.findAll(baseSpec);

        long dependencyBlocked = 0;
        long readyForNextStage = 0;

        for (WorkAssignment a : candidateAssignments) {
            if (a.getStatus() == AssignmentStatus.CANCELLED || a.getStatus() == AssignmentStatus.COMPLETED) {
                continue;
            }
            if (a.getReleaseStatus() == ReleaseStatus.REJECTED || a.getStatus() == AssignmentStatus.REJECTED) {
                dependencyBlocked++;
                continue;
            }

            List<BlockedDependencyDetail> blockers = workDependencyService.evaluateDependencies(
                a.getProject().getId(),
                a.getWorkZone().getId(),
                a.getWorkType(),
                a.getWorkZone().getZoneName()
            );

            if (!blockers.isEmpty()) {
                dependencyBlocked++;
            } else {
                if (a.getStatus() == AssignmentStatus.ASSIGNED || a.getStatus() == AssignmentStatus.ACCEPTED || a.getStatus() == AssignmentStatus.DRAFT) {
                    readyForNextStage++;
                }
            }
        }

        List<Project> accessibleProjects = getAccessibleProjects(currentUser, projectId);
        long totalProjects = accessibleProjects.size();

        return new DashboardSummaryResponse(
            totalProjects,
            activeAssignments,
            pendingAcceptance,
            inProgress,
            awaitingReview,
            dependencyBlocked,
            readyForNextStage,
            completedAssignments,
            totalAssignments
        );
    }

    @Transactional(readOnly = true)
    public AssignmentDistributionResponse getAssignmentDistribution(
        String projectId,
        String pincode,
        String workZoneId,
        String vendorId,
        WorkType workType,
        LocalDate startDate,
        LocalDate endDate,
        User currentUser
    ) {
        Specification<WorkAssignment> baseSpec = buildAssignmentSpec(
            projectId, pincode, workZoneId, vendorId, workType, null, startDate, endDate, currentUser
        );

        long total = workAssignmentRepository.count(baseSpec);
        List<AssignmentDistributionItem> items = new ArrayList<>();

        for (AssignmentStatus s : AssignmentStatus.values()) {
            Specification<WorkAssignment> statusSpec = baseSpec.and((root, q, cb) ->
                cb.equal(root.get("status"), s)
            );
            long count = workAssignmentRepository.count(statusSpec);
            double pct = total > 0 ? Math.round((double) count / total * 1000.0) / 10.0 : 0.0;
            String displayName = formatStatusName(s.name());
            items.add(new AssignmentDistributionItem(s.name(), displayName, count, pct));
        }

        return new AssignmentDistributionResponse(items, total);
    }

    private String formatStatusName(String enumName) {
        return Arrays.stream(enumName.split("_"))
            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
            .collect(Collectors.joining(" "));
    }

    @Transactional(readOnly = true)
    public ProjectProgressResponse getProjectProgress(String projectId, User currentUser) {
        List<Project> projects = getAccessibleProjects(currentUser, projectId);
        List<ProjectProgressItem> items = new ArrayList<>();

        for (Project p : projects) {
            long total = workAssignmentRepository.countByProjectId(p.getId());
            long cancelled = workAssignmentRepository.countByProjectIdAndStatus(p.getId(), AssignmentStatus.CANCELLED);
            long eligible = Math.max(0, total - cancelled);
            long completed = workAssignmentRepository.countByProjectIdAndStatus(p.getId(), AssignmentStatus.COMPLETED);
            long inProgress = workAssignmentRepository.countByProjectIdAndStatus(p.getId(), AssignmentStatus.IN_PROGRESS);

            // Blocked assignments in this project
            List<WorkAssignment> projectAssignments = workAssignmentRepository.findByProjectId(p.getId());
            long blocked = 0;
            for (WorkAssignment a : projectAssignments) {
                if (a.getStatus() == AssignmentStatus.CANCELLED || a.getStatus() == AssignmentStatus.COMPLETED) {
                    continue;
                }
                if (a.getReleaseStatus() == ReleaseStatus.REJECTED || a.getStatus() == AssignmentStatus.REJECTED) {
                    blocked++;
                    continue;
                }
                List<BlockedDependencyDetail> blockers = workDependencyService.evaluateDependencies(
                    p.getId(), a.getWorkZone().getId(), a.getWorkType(), a.getWorkZone().getZoneName()
                );
                if (!blockers.isEmpty()) {
                    blocked++;
                }
            }

            double percentage = eligible > 0
                ? Math.round((double) completed / eligible * 1000.0) / 10.0
                : 0.0;

            String location = p.getDistrict() + ", " + p.getState();
            String pmName = p.getProjectManager() != null ? p.getProjectManager().getFullName() : "Unassigned";

            items.add(new ProjectProgressItem(
                p.getId(),
                p.getProjectCode(),
                p.getProjectName(),
                location,
                pmName,
                total,
                completed,
                inProgress,
                blocked,
                percentage,
                p.getStatus().name()
            ));
        }

        return new ProjectProgressResponse(items);
    }

    @Transactional(readOnly = true)
    public WorkZoneOverviewResponse getWorkZoneOverview(
        String projectId,
        String pincode,
        String workZoneId,
        String vendorId,
        WorkType workType,
        AssignmentStatus status,
        Pageable pageable,
        User currentUser
    ) {
        List<Project> accessibleProjects = getAccessibleProjects(currentUser, projectId);
        Set<String> projectIds = accessibleProjects.stream().map(Project::getId).collect(Collectors.toSet());

        if (projectIds.isEmpty()) {
            return new WorkZoneOverviewResponse(Collections.emptyList(), pageable.getPageNumber(), pageable.getPageSize(), 0, 0);
        }

        Specification<WorkZone> zoneSpec = (root, q, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(root.get("project").get("id").in(projectIds));

            if (pincode != null && !pincode.isBlank()) {
                preds.add(cb.equal(root.get("pincode"), pincode.trim()));
            }

            if (workZoneId != null && !workZoneId.isBlank()) {
                preds.add(cb.equal(root.get("id"), workZoneId.trim()));
            }

            return cb.and(preds.toArray(new Predicate[0]));
        };

        Page<WorkZone> zonePage = workZoneRepository.findAll(zoneSpec, pageable);
        List<WorkZoneOverviewItem> items = new ArrayList<>();

        for (WorkZone z : zonePage.getContent()) {
            List<WorkAssignment> zoneAssignments = workAssignmentRepository.findByWorkZoneId(z.getId());

            if (vendorId != null && !vendorId.isBlank()) {
                zoneAssignments = zoneAssignments.stream()
                    .filter(a -> a.getVendor() != null && a.getVendor().getId().equals(vendorId.trim()))
                    .toList();
            }

            if (workType != null) {
                zoneAssignments = zoneAssignments.stream()
                    .filter(a -> a.getWorkType() == workType)
                    .toList();
            }

            if (status != null) {
                zoneAssignments = zoneAssignments.stream()
                    .filter(a -> a.getStatus() == status)
                    .toList();
            }

            long total = zoneAssignments.size();
            long active = zoneAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ASSIGNED || a.getStatus() == AssignmentStatus.ACCEPTED || a.getStatus() == AssignmentStatus.IN_PROGRESS)
                .count();
            long completed = zoneAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.COMPLETED)
                .count();

            long blocked = 0;
            for (WorkAssignment a : zoneAssignments) {
                if (a.getStatus() == AssignmentStatus.CANCELLED || a.getStatus() == AssignmentStatus.COMPLETED) {
                    continue;
                }
                if (a.getReleaseStatus() == ReleaseStatus.REJECTED || a.getStatus() == AssignmentStatus.REJECTED) {
                    blocked++;
                    continue;
                }
                List<BlockedDependencyDetail> blockers = workDependencyService.evaluateDependencies(
                    z.getProject().getId(), z.getId(), a.getWorkType(), z.getZoneName()
                );
                if (!blockers.isEmpty()) {
                    blocked++;
                }
            }

            String operationalStatus;
            if (blocked > 0) {
                operationalStatus = "BLOCKED";
            } else if (active > 0) {
                operationalStatus = "ACTIVE";
            } else {
                operationalStatus = z.getStatus().name();
            }

            items.add(new WorkZoneOverviewItem(
                z.getId(),
                z.getZoneCode(),
                z.getZoneName(),
                z.getPincode(),
                z.getLocality(),
                z.getDistrict(),
                z.getState(),
                z.getProject().getId(),
                z.getProject().getProjectCode(),
                z.getProject().getProjectName(),
                z.getCenterLatitude(),
                z.getCenterLongitude(),
                total,
                active,
                blocked,
                completed,
                operationalStatus
            ));
        }

        return new WorkZoneOverviewResponse(
            items,
            zonePage.getNumber(),
            zonePage.getSize(),
            zonePage.getTotalElements(),
            zonePage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public DependencyMonitoringResponse getDependencyMonitoring(
        String projectId,
        String workZoneId,
        User currentUser
    ) {
        Specification<WorkAssignment> spec = buildAssignmentSpec(
            projectId, null, workZoneId, null, null, null, null, null, currentUser
        );

        List<WorkAssignment> assignments = workAssignmentRepository.findAll(spec);
        List<BlockedDependencyItem> blockedList = new ArrayList<>();
        List<ReadyDependencyItem> readyList = new ArrayList<>();

        for (WorkAssignment a : assignments) {
            if (a.getStatus() == AssignmentStatus.CANCELLED || a.getStatus() == AssignmentStatus.COMPLETED) {
                continue;
            }

            String vendorName = a.getVendor() != null ? a.getVendor().getCompanyName() : "Unassigned";

            if (a.getReleaseStatus() == ReleaseStatus.REJECTED || a.getStatus() == AssignmentStatus.REJECTED) {
                blockedList.add(new BlockedDependencyItem(
                    a.getId(),
                    a.getAssignmentCode(),
                    a.getTitle(),
                    a.getWorkType().name(),
                    a.getWorkType().getDisplayName(),
                    a.getProject().getId(),
                    a.getProject().getProjectCode(),
                    a.getProject().getProjectName(),
                    a.getWorkZone().getId(),
                    a.getWorkZone().getZoneName(),
                    a.getWorkZone().getPincode(),
                    vendorName,
                    "N/A",
                    "Release / Assignment Rejected",
                    a.getAssignmentCode(),
                    vendorName,
                    a.getStatus().name(),
                    a.getReleaseStatus().name(),
                    a.getRejectionReason() != null ? a.getRejectionReason() : (a.getReleaseNotes() != null ? a.getReleaseNotes() : "Prerequisite rejected."),
                    "Resolve defect, perform rework, and request quality clearance review."
                ));
                continue;
            }

            List<BlockedDependencyDetail> blockers = workDependencyService.evaluateDependencies(
                a.getProject().getId(),
                a.getWorkZone().getId(),
                a.getWorkType(),
                a.getWorkZone().getZoneName()
            );

            if (!blockers.isEmpty()) {
                for (BlockedDependencyDetail b : blockers) {
                    blockedList.add(new BlockedDependencyItem(
                        a.getId(),
                        a.getAssignmentCode(),
                        a.getTitle(),
                        a.getWorkType().name(),
                        a.getWorkType().getDisplayName(),
                        a.getProject().getId(),
                        a.getProject().getProjectCode(),
                        a.getProject().getProjectName(),
                        a.getWorkZone().getId(),
                        a.getWorkZone().getZoneName(),
                        a.getWorkZone().getPincode(),
                        vendorName,
                        b.predecessorWorkType() != null ? b.predecessorWorkType().name() : "UNASSIGNED",
                        b.predecessorWorkTypeDisplayName(),
                        b.assignmentCode() != null ? b.assignmentCode() : "NONE",
                        b.assignedVendorName() != null ? b.assignedVendorName() : "Unassigned",
                        b.assignmentStatus() != null ? b.assignmentStatus().name() : "NOT_STARTED",
                        b.releaseStatus() != null ? b.releaseStatus().name() : "PENDING_RELEASE",
                        b.reason(),
                        b.requiredAction()
                    ));
                }
            } else {
                if (a.getStatus() == AssignmentStatus.ASSIGNED || a.getStatus() == AssignmentStatus.ACCEPTED || a.getStatus() == AssignmentStatus.DRAFT) {
                    String actionText = a.getStatus() == AssignmentStatus.ASSIGNED
                        ? "Awaiting vendor acceptance to commence field mobilization."
                        : (a.getStatus() == AssignmentStatus.ACCEPTED
                            ? "All dependencies cleared. Vendor authorized to start physical work."
                            : "Dependencies satisfied. Ready for assignment allocation.");

                    readyList.add(new ReadyDependencyItem(
                        a.getId(),
                        a.getAssignmentCode(),
                        a.getTitle(),
                        a.getWorkType().name(),
                        a.getWorkType().getDisplayName(),
                        a.getProject().getId(),
                        a.getProject().getProjectCode(),
                        a.getProject().getProjectName(),
                        a.getWorkZone().getId(),
                        a.getWorkZone().getZoneName(),
                        a.getWorkZone().getPincode(),
                        vendorName,
                        a.getStatus().name(),
                        a.getReleaseStatus().name(),
                        actionText
                    ));
                }
            }
        }

        return new DependencyMonitoringResponse(
            blockedList,
            readyList,
            blockedList.size(),
            readyList.size()
        );
    }

    @Transactional(readOnly = true)
    public VendorWorkloadResponse getVendorWorkload(String projectId, User currentUser) {
        List<Vendor> vendors;

        if (currentUser != null && currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vOpt = vendorRepository.findByUserId(currentUser.getId());
            vendors = vOpt.map(List::of).orElse(Collections.emptyList());
        } else if (currentUser != null && currentUser.getRole() == UserRole.PROJECT_MANAGER) {
            List<Project> pmProjects = getAccessibleProjects(currentUser, projectId);
            Set<String> projectIds = pmProjects.stream().map(Project::getId).collect(Collectors.toSet());
            List<WorkAssignment> assignments = workAssignmentRepository.findAll((root, q, cb) ->
                root.get("project").get("id").in(projectIds)
            );
            Set<String> vendorIds = assignments.stream()
                .map(a -> a.getVendor().getId())
                .collect(Collectors.toSet());
            vendors = vendorRepository.findAllById(vendorIds);
        } else {
            vendors = vendorRepository.findAll();
        }

        List<VendorWorkloadItem> items = new ArrayList<>();

        for (Vendor v : vendors) {
            List<WorkAssignment> vAssignments = workAssignmentRepository.findByVendorId(v.getId());

            if (projectId != null && !projectId.isBlank() && !"ALL".equalsIgnoreCase(projectId)) {
                vAssignments = vAssignments.stream()
                    .filter(a -> a.getProject().getId().equals(projectId.trim()))
                    .toList();
            }

            long active = vAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ASSIGNED || a.getStatus() == AssignmentStatus.ACCEPTED || a.getStatus() == AssignmentStatus.IN_PROGRESS)
                .count();

            long completed = vAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.COMPLETED)
                .count();

            long pending = vAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.ASSIGNED)
                .count();

            long rejected = vAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.REJECTED || a.getReleaseStatus() == ReleaseStatus.REJECTED)
                .count();

            long blocked = 0;
            for (WorkAssignment a : vAssignments) {
                if (a.getStatus() == AssignmentStatus.CANCELLED || a.getStatus() == AssignmentStatus.COMPLETED) {
                    continue;
                }
                if (a.getReleaseStatus() == ReleaseStatus.REJECTED || a.getStatus() == AssignmentStatus.REJECTED) {
                    blocked++;
                    continue;
                }
                List<BlockedDependencyDetail> blockers = workDependencyService.evaluateDependencies(
                    a.getProject().getId(), a.getWorkZone().getId(), a.getWorkType(), a.getWorkZone().getZoneName()
                );
                if (!blockers.isEmpty()) {
                    blocked++;
                }
            }

            Set<String> categories = v.getServiceCategories() != null
                ? v.getServiceCategories().stream()
                    .map(Enum::name)
                    .collect(Collectors.toSet())
                : Collections.emptySet();

            items.add(new VendorWorkloadItem(
                v.getId(),
                v.getVendorCode(),
                v.getCompanyName(),
                v.getContactPerson(),
                v.getStatus().name(),
                active,
                completed,
                pending,
                blocked,
                rejected,
                active, // Workload is defined as active assignments
                categories
            ));
        }

        return new VendorWorkloadResponse(items);
    }

    @Transactional(readOnly = true)
    public RecentActivityResponse getRecentActivity(String projectId, Pageable pageable, User currentUser) {
        Page<AuditEvent> eventPage;

        if (currentUser != null && currentUser.getRole() == UserRole.VENDOR) {
            Optional<Vendor> vOpt = vendorRepository.findByUserId(currentUser.getId());
            if (vOpt.isEmpty()) {
                return new RecentActivityResponse(Collections.emptyList(), pageable.getPageNumber(), pageable.getPageSize(), 0, 0);
            }
            List<WorkAssignment> vAssignments = workAssignmentRepository.findByVendorId(vOpt.get().getId());
            Set<String> entityIds = vAssignments.stream().map(WorkAssignment::getId).collect(Collectors.toSet());
            entityIds.add(vOpt.get().getId());
            if (entityIds.isEmpty()) {
                return new RecentActivityResponse(Collections.emptyList(), pageable.getPageNumber(), pageable.getPageSize(), 0, 0);
            }
            eventPage = auditEventRepository.findByEntityIdInOrderByCreatedAtDesc(entityIds, pageable);
        } else if (projectId != null && !projectId.isBlank() && !"ALL".equalsIgnoreCase(projectId)) {
            List<WorkAssignment> pAssignments = workAssignmentRepository.findByProjectId(projectId.trim());
            Set<String> entityIds = pAssignments.stream().map(WorkAssignment::getId).collect(Collectors.toSet());
            entityIds.add(projectId.trim());
            eventPage = auditEventRepository.findByEntityIdInOrderByCreatedAtDesc(entityIds, pageable);
        } else {
            eventPage = auditEventRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<RecentActivityItem> items = new ArrayList<>();
        Map<String, String> userNames = new HashMap<>();

        for (AuditEvent e : eventPage.getContent()) {
            String actorName = "System";
            String actorRole = "AUTOMATED";

            if (e.getActorId() != null) {
                if (userNames.containsKey(e.getActorId())) {
                    actorName = userNames.get(e.getActorId());
                } else {
                    Optional<User> uOpt = userRepository.findById(e.getActorId());
                    if (uOpt.isPresent()) {
                        actorName = uOpt.get().getFullName();
                        actorRole = uOpt.get().getRole().name();
                        userNames.put(e.getActorId(), actorName);
                    }
                }
            }

            String projectRef = null;
            String workZoneRef = null;
            String assignmentCode = null;

            if ("WORK_ASSIGNMENT".equalsIgnoreCase(e.getEntityType())) {
                Optional<WorkAssignment> aOpt = workAssignmentRepository.findById(e.getEntityId());
                if (aOpt.isPresent()) {
                    WorkAssignment wa = aOpt.get();
                    projectRef = wa.getProject().getProjectCode();
                    workZoneRef = wa.getWorkZone().getZoneCode();
                    assignmentCode = wa.getAssignmentCode();
                }
            } else if ("WORK_ZONE".equalsIgnoreCase(e.getEntityType())) {
                Optional<WorkZone> zOpt = workZoneRepository.findById(e.getEntityId());
                if (zOpt.isPresent()) {
                    workZoneRef = zOpt.get().getZoneCode();
                    projectRef = zOpt.get().getProject().getProjectCode();
                }
            } else if ("PROJECT".equalsIgnoreCase(e.getEntityType())) {
                Optional<Project> pOpt = projectRepository.findById(e.getEntityId());
                if (pOpt.isPresent()) {
                    projectRef = pOpt.get().getProjectCode();
                }
            }

            String title = formatEventTitle(e.getEventType());

            items.add(new RecentActivityItem(
                e.getId(),
                e.getEventType(),
                title,
                e.getEntityType(),
                e.getEntityId(),
                e.getSummary(),
                e.getReason(),
                e.getActorId(),
                actorName,
                actorRole,
                projectRef,
                workZoneRef,
                assignmentCode,
                e.getCreatedAt()
            ));
        }

        return new RecentActivityResponse(
            items,
            eventPage.getNumber(),
            eventPage.getSize(),
            eventPage.getTotalElements(),
            eventPage.getTotalPages()
        );
    }

    private String formatEventTitle(String eventType) {
        if (eventType == null) return "System Activity";
        return switch (eventType) {
            case "WORK_ASSIGNMENT_CREATED" -> "Work Assignment Allocated";
            case "VENDOR_ACCEPTED_ASSIGNMENT" -> "Vendor Accepted Assignment";
            case "VENDOR_REJECTED_ASSIGNMENT" -> "Vendor Declined Assignment";
            case "WORK_STARTED" -> "Field Execution Started";
            case "WORK_SUBMITTED_FOR_REVIEW" -> "Work Submitted for Review";
            case "WORK_COMPLETED" -> "Assignment Completed";
            case "PREREQUISITE_RELEASED" -> "Prerequisite Cleared & Released";
            case "PREREQUISITE_RELEASE_REJECTED" -> "Prerequisite Release Rejected";
            case "ASSIGNMENT_VALIDATION_BLOCKED" -> "Dependency Validation Blocked";
            case "SCHEDULING_CONFLICT_DETECTED" -> "Scheduling Conflict Detected";
            case "DEPENDENCY_RULE_CREATED" -> "New Dependency Rule Configured";
            case "PROJECT_CREATED" -> "Infrastructure Project Created";
            case "WORK_ZONE_CREATED" -> "Work Zone Operationalized";
            case "VENDOR_ASSOCIATED" -> "Vendor Project Onboarding";
            default -> formatStatusName(eventType);
        };
    }

    @Transactional(readOnly = true)
    public DashboardSearchResponse globalSearch(String query, User currentUser) {
        if (query == null || query.isBlank() || query.trim().length() < 2) {
            return new DashboardSearchResponse(Collections.emptyList(), 0);
        }

        String term = query.trim().toLowerCase();
        List<DashboardSearchItem> results = new ArrayList<>();

        // 1. Search Work Assignments
        Specification<WorkAssignment> spec = buildAssignmentSpec(
            null, null, null, null, null, null, null, null, currentUser
        );
        Specification<WorkAssignment> searchSpec = spec.and((root, q, cb) -> {
            String pattern = "%" + term + "%";
            return cb.or(
                cb.like(cb.lower(root.get("assignmentCode")), pattern),
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("vendor").get("companyName")), pattern),
                cb.like(cb.lower(root.get("workZone").get("zoneName")), pattern),
                cb.like(cb.lower(root.get("workZone").get("pincode")), pattern)
            );
        });

        Page<WorkAssignment> assignments = workAssignmentRepository.findAll(searchSpec, PageRequest.of(0, 10));
        for (WorkAssignment a : assignments) {
            results.add(new DashboardSearchItem(
                a.getId(),
                "ASSIGNMENT",
                a.getAssignmentCode(),
                a.getTitle(),
                a.getWorkZone().getZoneName() + " (" + a.getWorkZone().getPincode() + ") • " + a.getVendor().getCompanyName(),
                a.getStatus().name(),
                "/work-assignments/" + a.getId()
            ));
        }

        // 2. Search Work Zones
        List<Project> accessibleProjects = getAccessibleProjects(currentUser, null);
        Set<String> projectIds = accessibleProjects.stream().map(Project::getId).collect(Collectors.toSet());
        if (!projectIds.isEmpty()) {
            Specification<WorkZone> zoneSpec = (root, q, cb) -> {
                String pattern = "%" + term + "%";
                return cb.and(
                    root.get("project").get("id").in(projectIds),
                    cb.or(
                        cb.like(cb.lower(root.get("zoneCode")), pattern),
                        cb.like(cb.lower(root.get("zoneName")), pattern),
                        cb.like(cb.lower(root.get("pincode")), pattern),
                        cb.like(cb.lower(root.get("locality")), pattern)
                    )
                );
            };
            Page<WorkZone> zones = workZoneRepository.findAll(zoneSpec, PageRequest.of(0, 5));
            for (WorkZone z : zones) {
                results.add(new DashboardSearchItem(
                    z.getId(),
                    "ZONE",
                    z.getZoneCode(),
                    z.getZoneName() + " (PIN: " + z.getPincode() + ")",
                    z.getProject().getProjectName() + " • " + z.getLocality(),
                    z.getStatus().name(),
                    "/work-zones"
                ));
            }
        }

        // 3. Search Vendors (if user is not vendor restricted)
        if (currentUser == null || currentUser.getRole() != UserRole.VENDOR) {
            Page<Vendor> vendorPage = vendorRepository.findAll((root, q, cb) -> {
                String pattern = "%" + term + "%";
                return cb.or(
                    cb.like(cb.lower(root.get("vendorCode")), pattern),
                    cb.like(cb.lower(root.get("companyName")), pattern),
                    cb.like(cb.lower(root.get("contactPerson")), pattern)
                );
            }, PageRequest.of(0, 5));

            for (Vendor v : vendorPage) {
                results.add(new DashboardSearchItem(
                    v.getId(),
                    "VENDOR",
                    v.getVendorCode(),
                    v.getCompanyName(),
                    v.getContactPerson() + " • " + v.getCity() + ", " + v.getState(),
                    v.getStatus().name(),
                    "/vendors/" + v.getId()
                ));
            }
        }

        // 4. Search Projects
        for (Project p : accessibleProjects) {
            if (p.getProjectCode().toLowerCase().contains(term) || p.getProjectName().toLowerCase().contains(term)) {
                results.add(new DashboardSearchItem(
                    p.getId(),
                    "PROJECT",
                    p.getProjectCode(),
                    p.getProjectName(),
                    p.getClientName() + " • " + p.getDistrict() + ", " + p.getState(),
                    p.getStatus().name(),
                    "/projects/" + p.getId()
                ));
            }
        }

        return new DashboardSearchResponse(results, results.size());
    }
}
