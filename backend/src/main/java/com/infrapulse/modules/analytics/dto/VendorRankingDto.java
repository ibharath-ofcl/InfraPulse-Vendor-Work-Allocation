package com.infrapulse.modules.analytics.dto;

import com.infrapulse.modules.analytics.enums.DataSufficiencyStatus;

import java.math.BigDecimal;

public class VendorRankingDto {

    private int rank;
    private String vendorId;
    private String vendorCode;
    private String companyName;
    private BigDecimal overallScore = BigDecimal.ZERO;
    private String tier = "SATISFACTORY";
    private DataSufficiencyStatus dataSufficiencyStatus = DataSufficiencyStatus.SUFFICIENT_DATA;
    private BigDecimal qualityPassRate = BigDecimal.ZERO;
    private BigDecimal onTimeRate = BigDecimal.ZERO;
    private BigDecimal reworkRate = BigDecimal.ZERO;
    private BigDecimal completionRate = BigDecimal.ZERO;
    private long totalAssignments = 0L;

    public VendorRankingDto() {
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public String getVendorCode() {
        return vendorCode;
    }

    public void setVendorCode(String vendorCode) {
        this.vendorCode = vendorCode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public BigDecimal getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(BigDecimal overallScore) {
        this.overallScore = overallScore;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public DataSufficiencyStatus getDataSufficiencyStatus() {
        return dataSufficiencyStatus;
    }

    public void setDataSufficiencyStatus(DataSufficiencyStatus dataSufficiencyStatus) {
        this.dataSufficiencyStatus = dataSufficiencyStatus;
    }

    public BigDecimal getQualityPassRate() {
        return qualityPassRate;
    }

    public void setQualityPassRate(BigDecimal qualityPassRate) {
        this.qualityPassRate = qualityPassRate;
    }

    public BigDecimal getOnTimeRate() {
        return onTimeRate;
    }

    public void setOnTimeRate(BigDecimal onTimeRate) {
        this.onTimeRate = onTimeRate;
    }

    public BigDecimal getReworkRate() {
        return reworkRate;
    }

    public void setReworkRate(BigDecimal reworkRate) {
        this.reworkRate = reworkRate;
    }

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public long getTotalAssignments() {
        return totalAssignments;
    }

    public void setTotalAssignments(long totalAssignments) {
        this.totalAssignments = totalAssignments;
    }
}
