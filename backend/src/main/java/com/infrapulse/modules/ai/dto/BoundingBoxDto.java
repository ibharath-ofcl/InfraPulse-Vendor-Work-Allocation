package com.infrapulse.modules.ai.dto;

public class BoundingBoxDto {
    private Double ymin;
    private Double xmin;
    private Double ymax;
    private Double xmax;

    public BoundingBoxDto() {}

    public BoundingBoxDto(Double ymin, Double xmin, Double ymax, Double xmax) {
        this.ymin = ymin;
        this.xmin = xmin;
        this.ymax = ymax;
        this.xmax = xmax;
    }

    public Double getYmin() { return ymin; }
    public void setYmin(Double ymin) { this.ymin = ymin; }

    public Double getXmin() { return xmin; }
    public void setXmin(Double xmin) { this.xmin = xmin; }

    public Double getYmax() { return ymax; }
    public void setYmax(Double ymax) { this.ymax = ymax; }

    public Double getXmax() { return xmax; }
    public void setXmax(Double xmax) { this.xmax = xmax; }
}
