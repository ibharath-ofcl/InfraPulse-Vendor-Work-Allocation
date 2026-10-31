package com.infrapulse.modules.analytics.dto;

import com.infrapulse.modules.analytics.enums.ReportFormat;
import com.infrapulse.modules.analytics.enums.ReportJobStatus;
import com.infrapulse.modules.analytics.enums.ReportType;

public class ReportJobResponseDto {

    private String id;
    private String reportCode;
    private ReportType reportType;
    private String title;
    private ReportFormat format;
    private ReportJobStatus status;
    private Integer recordCount;
    private String requestedByName;
    private String createdAt;
    private String completedAt;

    public ReportJobResponseDto() {
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

    public Integer getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(Integer recordCount) {
        this.recordCount = recordCount;
    }

    public String getRequestedByName() {
        return requestedByName;
    }

    public void setRequestedByName(String requestedByName) {
        this.requestedByName = requestedByName;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(String completedAt) {
        this.completedAt = completedAt;
    }
}
