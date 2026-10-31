package com.infrapulse.modules.analytics.entity;

import com.infrapulse.modules.analytics.enums.ReportFormat;
import com.infrapulse.modules.analytics.enums.ReportJobStatus;
import com.infrapulse.modules.analytics.enums.ReportType;
import com.infrapulse.modules.auth.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analytics_report_jobs")
public class AnalyticsReportJob {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "report_code", length = 64, unique = true)
    private String reportCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", length = 50, nullable = false)
    private ReportType reportType;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", length = 16, nullable = false)
    private ReportFormat format = ReportFormat.CSV;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private ReportJobStatus status = ReportJobStatus.COMPLETED;

    @Column(name = "filter_parameters", columnDefinition = "TEXT")
    private String filterParameters;

    @Column(name = "record_count")
    private Integer recordCount = 0;

    @Column(name = "output_reference", columnDefinition = "TEXT")
    private String outputReference;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public AnalyticsReportJob() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReportCode() {
        return reportCode;
    }

    public void setReportCode(String reportCode) {
        this.reportCode = reportCode;
    }

    public ReportType getReportType() {
        return reportType;
    }

    public void setReportType(ReportType reportType) {
        this.reportType = reportType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User requestedBy) {
        this.requestedBy = requestedBy;
    }

    public ReportFormat getFormat() {
        return format;
    }

    public void setFormat(ReportFormat format) {
        this.format = format;
    }

    public ReportJobStatus getStatus() {
        return status;
    }

    public void setStatus(ReportJobStatus status) {
        this.status = status;
    }

    public String getFilterParameters() {
        return filterParameters;
    }

    public void setFilterParameters(String filterParameters) {
        this.filterParameters = filterParameters;
    }

    public Integer getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(Integer recordCount) {
        this.recordCount = recordCount;
    }

    public String getOutputReference() {
        return outputReference;
    }

    public void setOutputReference(String outputReference) {
        this.outputReference = outputReference;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
