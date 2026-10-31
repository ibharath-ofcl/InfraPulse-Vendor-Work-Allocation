package com.infrapulse.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class VendorComparisonDto {

    private List<VendorPerformanceDto> vendors = new ArrayList<>();
    private BigDecimal benchmarkQualityPassRate = BigDecimal.ZERO;
    private BigDecimal benchmarkOnTimeRate = BigDecimal.ZERO;
    private BigDecimal benchmarkReworkRate = BigDecimal.ZERO;
    private BigDecimal benchmarkCompletionRate = BigDecimal.ZERO;
    private BigDecimal benchmarkOverallScore = BigDecimal.ZERO;

    public VendorComparisonDto() {
    }

    public List<VendorPerformanceDto> getVendors() {
        return vendors;
    }

    public void setVendors(List<VendorPerformanceDto> vendors) {
        this.vendors = vendors;
    }

    public BigDecimal getBenchmarkQualityPassRate() {
        return benchmarkQualityPassRate;
    }

    public void setBenchmarkQualityPassRate(BigDecimal benchmarkQualityPassRate) {
        this.benchmarkQualityPassRate = benchmarkQualityPassRate;
    }

    public BigDecimal getBenchmarkOnTimeRate() {
        return benchmarkOnTimeRate;
    }

    public void setBenchmarkOnTimeRate(BigDecimal benchmarkOnTimeRate) {
        this.benchmarkOnTimeRate = benchmarkOnTimeRate;
    }

    public BigDecimal getBenchmarkReworkRate() {
        return benchmarkReworkRate;
    }

    public void setBenchmarkReworkRate(BigDecimal benchmarkReworkRate) {
        this.benchmarkReworkRate = benchmarkReworkRate;
    }

    public BigDecimal getBenchmarkCompletionRate() {
        return benchmarkCompletionRate;
    }

    public void setBenchmarkCompletionRate(BigDecimal benchmarkCompletionRate) {
        this.benchmarkCompletionRate = benchmarkCompletionRate;
    }

    public BigDecimal getBenchmarkOverallScore() {
        return benchmarkOverallScore;
    }

    public void setBenchmarkOverallScore(BigDecimal benchmarkOverallScore) {
        this.benchmarkOverallScore = benchmarkOverallScore;
    }
}
