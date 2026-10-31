package com.infrapulse.modules.analytics.dto;

import com.infrapulse.modules.analytics.enums.ReportFormat;
import com.infrapulse.modules.analytics.enums.ReportType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ExportReportRequestDto {

    @NotNull
    private ReportType reportType;

    private ReportFormat format = ReportFormat.CSV;
    private String title;
    private String projectId;
    private String vendorId;
    private LocalDate startDate;
    private LocalDate endDate;

    public ExportReportRequestDto() {
    }

    public ReportType getReportType() {
        return reportType;
    }

    public void setReportType(ReportType reportType) {
        this.reportType = reportType;
    }

    public ReportFormat getFormat() {
        return format;
    }

    public void setFormat(ReportFormat format) {
        this.format = format;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
