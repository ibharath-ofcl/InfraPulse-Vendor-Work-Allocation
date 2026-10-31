package com.infrapulse.modules.analytics.service;

import com.infrapulse.common.audit.AuditCategory;
import com.infrapulse.common.audit.AuditEvent;
import com.infrapulse.common.audit.AuditEventRepository;
import com.infrapulse.common.audit.AuditOutcome;
import com.infrapulse.common.audit.AuditService;
import com.infrapulse.modules.analytics.dto.ExportReportRequestDto;
import com.infrapulse.modules.analytics.dto.ReportJobResponseDto;
import com.infrapulse.modules.analytics.dto.VendorPerformanceDto;
import com.infrapulse.modules.analytics.entity.AnalyticsReportJob;
import com.infrapulse.modules.analytics.enums.ReportFormat;
import com.infrapulse.modules.analytics.enums.ReportJobStatus;
import com.infrapulse.modules.analytics.enums.ReportType;
import com.infrapulse.modules.analytics.repository.AnalyticsReportJobRepository;
import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.auth.model.UserRole;
import com.infrapulse.modules.finance.entity.ProjectMilestone;
import com.infrapulse.modules.finance.repository.ProjectMilestoneRepository;
import com.infrapulse.modules.humanreview.entity.CorrectiveAction;
import com.infrapulse.modules.humanreview.repository.CorrectiveActionRepository;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.project.repository.ProjectRepository;
import com.infrapulse.modules.quality.entity.QualityAssessment;
import com.infrapulse.modules.quality.repository.QualityAssessmentRepository;
import com.infrapulse.modules.workassignment.entity.WorkAssignment;
import com.infrapulse.modules.workassignment.repository.WorkAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ReportExportService {

    private static final Logger log = LoggerFactory.getLogger(ReportExportService.class);
    private static final AtomicLong REPORT_SEQ = new AtomicLong(1000);

    private final AnalyticsReportJobRepository reportJobRepository;
    private final VendorPerformanceAnalyticsService vendorAnalyticsService;
    private final ProjectRepository projectRepository;
    private final WorkAssignmentRepository assignmentRepository;
    private final QualityAssessmentRepository assessmentRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final AuditEventRepository auditEventRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final AuditService auditService;

    public ReportExportService(
            AnalyticsReportJobRepository reportJobRepository,
            VendorPerformanceAnalyticsService vendorAnalyticsService,
            ProjectRepository projectRepository,
            WorkAssignmentRepository assignmentRepository,
            QualityAssessmentRepository assessmentRepository,
            CorrectiveActionRepository correctiveActionRepository,
            AuditEventRepository auditEventRepository,
            ProjectMilestoneRepository milestoneRepository,
            AuditService auditService
    ) {
        this.reportJobRepository = reportJobRepository;
        this.vendorAnalyticsService = vendorAnalyticsService;
        this.projectRepository = projectRepository;
        this.assignmentRepository = assignmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.auditEventRepository = auditEventRepository;
        this.milestoneRepository = milestoneRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ReportJobResponseDto exportReport(ExportReportRequestDto request, User user) {
        // Enforce RBAC
        if (user.getRole() == UserRole.VENDOR) {
            if (request.getReportType() != ReportType.VENDOR_PERFORMANCE &&
                request.getReportType() != ReportType.WORK_ASSIGNMENT) {
                throw new AccessDeniedException("Vendors are only authorized to export performance and work assignment reports");
            }
            request.setVendorId(user.getId());
        }

        String reportCode = "REP-" + REPORT_SEQ.incrementAndGet();
        String title = request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle()
                : "Report: " + request.getReportType().name();

        String csvData = generateCsvContent(request, user);
        int recordCount = Math.max(0, csvData.split("\n").length - 1);

        AnalyticsReportJob job = new AnalyticsReportJob();
        job.setId(UUID.randomUUID().toString());
        job.setReportCode(reportCode);
        job.setReportType(request.getReportType());
        job.setTitle(title);
        job.setRequestedBy(user);
        job.setFormat(ReportFormat.CSV);
        job.setStatus(ReportJobStatus.COMPLETED);
        job.setRecordCount(recordCount);
        job.setOutputReference(csvData);
        job.setCompletedAt(Instant.now());

        AnalyticsReportJob saved = reportJobRepository.save(job);

        auditService.recordRichEvent(
                user, AuditCategory.SYSTEM, "REPORT_EXPORTED", "EXPORT_REPORT",
                "REPORT", saved.getId(), reportCode, request.getProjectId(), request.getVendorId(),
                AuditOutcome.SUCCESS, "Exported " + request.getReportType() + " report with " + recordCount + " records",
                null, null, "ANALYTICS_MODULE", null, null, null
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReportJobResponseDto> getReportJobs(User user, Pageable pageable) {
        Page<AnalyticsReportJob> page = (user.getRole() == UserRole.PLATFORM_ADMIN)
                ? reportJobRepository.findAllByOrderByCreatedAtDesc(pageable)
                : reportJobRepository.findByRequestedByIdOrderByCreatedAtDesc(user.getId(), pageable);
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public ReportJobResponseDto getReportJob(String reportId, User user) {
        AnalyticsReportJob job = reportJobRepository.findById(reportId)
                .or(() -> reportJobRepository.findByReportCode(reportId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report job not found: " + reportId));

        if (user.getRole() != UserRole.PLATFORM_ADMIN && !job.getRequestedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized to access other user's report job");
        }

        return mapToDto(job);
    }

    @Transactional(readOnly = true)
    public byte[] downloadReportContent(String reportId, User user) {
        AnalyticsReportJob job = reportJobRepository.findById(reportId)
                .or(() -> reportJobRepository.findByReportCode(reportId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report job not found: " + reportId));

        if (user.getRole() != UserRole.PLATFORM_ADMIN && !job.getRequestedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized to download other user's report job");
        }

        String content = job.getOutputReference() != null ? job.getOutputReference() : "";
        return content.getBytes(StandardCharsets.UTF_8);
    }

    private String generateCsvContent(ExportReportRequestDto req, User user) {
        StringBuilder sb = new StringBuilder();

        switch (req.getReportType()) {
            case VENDOR_PERFORMANCE -> {
                sb.append("Vendor Code,Company Name,Overall Score,Tier,Quality Pass Rate (%),On-Time Rate (%),Rework Rate (%),Completion Rate (%),Total Assignments\n");
                List<VendorPerformanceDto> vendors = vendorAnalyticsService.getAllVendorsPerformance(req.getProjectId());
                for (VendorPerformanceDto v : vendors) {
                    sb.append(escape(v.getVendorCode())).append(",")
                            .append(escape(v.getCompanyName())).append(",")
                            .append(v.getOverallScore()).append(",")
                            .append(v.getRankingTier()).append(",")
                            .append(v.getQualityPassRate()).append(",")
                            .append(v.getOnTimeRate()).append(",")
                            .append(v.getReworkRate()).append(",")
                            .append(v.getCompletionRate()).append(",")
                            .append(v.getSampleCounts().getOrDefault("totalEligibleAssignments", 0L)).append("\n");
                }
            }
            case PROJECT_PROGRESS -> {
                sb.append("Project Code,Project Name,Status,Budget,Total Assignments,Approved Assignments,Completion Rate (%),Milestone Progress (%)\n");
                List<Project> projects = projectRepository.findAll();
                for (Project p : projects) {
                    List<WorkAssignment> as = assignmentRepository.findByProjectId(p.getId());
                    long comp = as.stream().filter(a -> a.getStatus() == com.infrapulse.modules.workassignment.enums.AssignmentStatus.COMPLETED).count();
                    double rate = !as.isEmpty() ? (comp * 100.0 / as.size()) : 0.0;
                    sb.append(escape(p.getProjectCode())).append(",")
                            .append(escape(p.getProjectName())).append(",")
                            .append(p.getStatus() != null ? p.getStatus().name() : "").append(",")
                            .append(p.getBudget() != null ? p.getBudget() : 0).append(",")
                            .append(as.size()).append(",")
                            .append(comp).append(",")
                            .append(String.format("%.2f", rate)).append(",")
                            .append("100.00").append("\n");
                }
            }
            case WORK_ASSIGNMENT -> {
                sb.append("Assignment Code,Title,Work Type,Vendor,Project,Status,Release Status,Planned Start,Target End\n");
                List<WorkAssignment> as = (req.getProjectId() != null)
                        ? assignmentRepository.findByProjectId(req.getProjectId())
                        : assignmentRepository.findAll();
                for (WorkAssignment a : as) {
                    sb.append(escape(a.getAssignmentCode())).append(",")
                            .append(escape(a.getTitle())).append(",")
                            .append(a.getWorkType() != null ? a.getWorkType().name() : "").append(",")
                            .append(a.getVendor() != null ? escape(a.getVendor().getCompanyName()) : "").append(",")
                            .append(a.getProject() != null ? escape(a.getProject().getProjectName()) : "").append(",")
                            .append(a.getStatus() != null ? a.getStatus().name() : "").append(",")
                            .append(a.getReleaseStatus() != null ? a.getReleaseStatus().name() : "").append(",")
                            .append(a.getPlannedStartDate()).append(",")
                            .append(a.getTargetEndDate()).append("\n");
                }
            }
            case QUALITY_INSPECTION -> {
                sb.append("Assessment Code,Assignment Code,Status,Completeness Score,Total Criteria,Passed Criteria,Created At\n");
                List<QualityAssessment> qas = assessmentRepository.findAll();
                for (QualityAssessment q : qas) {
                    sb.append(escape(q.getAssessmentCode())).append(",")
                            .append(q.getAssignment() != null ? escape(q.getAssignment().getAssignmentCode()) : "").append(",")
                            .append(q.getStatus() != null ? q.getStatus().name() : "").append(",")
                            .append(q.getEvidenceCompletenessScore()).append(",")
                            .append(q.getTotalCriteriaEvaluated()).append(",")
                            .append(q.getPassedCriteriaCount()).append(",")
                            .append(q.getCreatedAt()).append("\n");
                }
            }
            case CORRECTIVE_ACTION -> {
                sb.append("Action Code,Vendor,Action Type,Severity,Status,Description,Due At,Created At\n");
                List<CorrectiveAction> cas = correctiveActionRepository.findAll();
                for (CorrectiveAction ca : cas) {
                    sb.append(escape(ca.getActionCode())).append(",")
                            .append(ca.getVendor() != null ? escape(ca.getVendor().getCompanyName()) : "").append(",")
                            .append(ca.getActionType() != null ? ca.getActionType().name() : "").append(",")
                            .append(ca.getSeverity() != null ? ca.getSeverity().name() : "").append(",")
                            .append(ca.getStatus() != null ? ca.getStatus().name() : "").append(",")
                            .append(escape(ca.getDescription())).append(",")
                            .append(ca.getDueAt()).append(",")
                            .append(ca.getCreatedAt()).append("\n");
                }
            }
            case AUDIT_EVENT -> {
                sb.append("Event Code,Category,Event Type,Actor,Entity Type,Entity Reference,Outcome,Created At,Event Hash\n");
                List<AuditEvent> events = auditEventRepository.findAll();
                for (AuditEvent e : events) {
                    sb.append(escape(e.getEventCode())).append(",")
                            .append(e.getEventCategory() != null ? e.getEventCategory().name() : "").append(",")
                            .append(escape(e.getEventType())).append(",")
                            .append(escape(e.getActorName())).append(",")
                            .append(escape(e.getEntityType())).append(",")
                            .append(escape(e.getEntityReference())).append(",")
                            .append(e.getOutcome() != null ? e.getOutcome().name() : "").append(",")
                            .append(e.getCreatedAt()).append(",")
                            .append(escape(e.getEventHash())).append("\n");
                }
            }
            case MILESTONE_FINANCIAL -> {
                sb.append("Milestone Code,Name,Project,Vendor,Milestone Value,Status,Payment Policy,Sequence\n");
                List<ProjectMilestone> mls = milestoneRepository.findAll();
                for (ProjectMilestone m : mls) {
                    sb.append(escape(m.getMilestoneCode())).append(",")
                            .append(escape(m.getName())).append(",")
                            .append(m.getProject() != null ? escape(m.getProject().getProjectName()) : "").append(",")
                            .append(m.getVendor() != null ? escape(m.getVendor().getCompanyName()) : "").append(",")
                            .append(m.getMilestoneValue()).append(",")
                            .append(m.getStatus() != null ? m.getStatus().name() : "").append(",")
                            .append(m.getPaymentPolicy() != null ? m.getPaymentPolicy().name() : "").append(",")
                            .append(m.getSequenceNumber()).append("\n");
                }
            }
        }

        return sb.toString();
    }

    private String escape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private ReportJobResponseDto mapToDto(AnalyticsReportJob entity) {
        ReportJobResponseDto dto = new ReportJobResponseDto();
        dto.setId(entity.getId());
        dto.setReportCode(entity.getReportCode());
        dto.setReportType(entity.getReportType());
        dto.setTitle(entity.getTitle());
        dto.setFormat(entity.getFormat());
        dto.setStatus(entity.getStatus());
        dto.setRecordCount(entity.getRecordCount());
        if (entity.getRequestedBy() != null) {
            dto.setRequestedByName(entity.getRequestedBy().getFullName());
        }
        if (entity.getCreatedAt() != null) {
            dto.setCreatedAt(entity.getCreatedAt().toString());
        }
        if (entity.getCompletedAt() != null) {
            dto.setCompletedAt(entity.getCompletedAt().toString());
        }
        return dto;
    }
}
