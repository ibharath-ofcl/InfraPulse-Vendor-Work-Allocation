package com.infrapulse.modules.workzone.entity;

import com.infrapulse.modules.auth.model.User;
import com.infrapulse.modules.project.entity.Project;
import com.infrapulse.modules.workzone.enums.ZoneStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "work_zones")
public class WorkZone {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "zone_code", length = 50, nullable = false, unique = true)
    private String zoneCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "zone_name", length = 255, nullable = false)
    private String zoneName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "pincode", length = 20, nullable = false)
    private String pincode;

    @Column(name = "locality", length = 150, nullable = false)
    private String locality;

    @Column(name = "district", length = 100, nullable = false)
    private String district;

    @Column(name = "state", length = 100, nullable = false)
    private String state;

    @Column(name = "center_latitude", precision = 10, scale = 6)
    private BigDecimal centerLatitude;

    @Column(name = "center_longitude", precision = 10, scale = 6)
    private BigDecimal centerLongitude;

    @Column(name = "geofence_radius_meters", nullable = false)
    private Integer geofenceRadiusMeters = 500;

    @Column(name = "boundary_polygon_json", columnDefinition = "TEXT")
    private String boundaryPolygonJson;

    @Column(name = "is_exclusive_lock_enabled", nullable = false)
    private boolean isExclusiveLockEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private ZoneStatus status = ZoneStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public WorkZone() {
    }

    public WorkZone(
        String id,
        String zoneCode,
        Project project,
        String zoneName,
        String description,
        String pincode,
        String locality,
        String district,
        String state,
        BigDecimal centerLatitude,
        BigDecimal centerLongitude,
        ZoneStatus status,
        User createdBy
    ) {
        this.id = id;
        this.zoneCode = zoneCode;
        this.project = project;
        this.zoneName = zoneName;
        this.description = description;
        this.pincode = pincode;
        this.locality = locality;
        this.district = district;
        this.state = state;
        this.centerLatitude = centerLatitude;
        this.centerLongitude = centerLongitude;
        this.status = status != null ? status : ZoneStatus.AVAILABLE;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getZoneCode() {
        return zoneCode;
    }

    public void setZoneCode(String zoneCode) {
        this.zoneCode = zoneCode;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public BigDecimal getCenterLatitude() {
        return centerLatitude;
    }

    public void setCenterLatitude(BigDecimal centerLatitude) {
        this.centerLatitude = centerLatitude;
    }

    public BigDecimal getCenterLongitude() {
        return centerLongitude;
    }

    public void setCenterLongitude(BigDecimal centerLongitude) {
        this.centerLongitude = centerLongitude;
    }

    public Integer getGeofenceRadiusMeters() {
        return geofenceRadiusMeters;
    }

    public void setGeofenceRadiusMeters(Integer geofenceRadiusMeters) {
        this.geofenceRadiusMeters = geofenceRadiusMeters != null ? geofenceRadiusMeters : 500;
    }

    public String getBoundaryPolygonJson() {
        return boundaryPolygonJson;
    }

    public void setBoundaryPolygonJson(String boundaryPolygonJson) {
        this.boundaryPolygonJson = boundaryPolygonJson;
    }

    public boolean isExclusiveLockEnabled() {
        return isExclusiveLockEnabled;
    }

    public void setExclusiveLockEnabled(boolean exclusiveLockEnabled) {
        isExclusiveLockEnabled = exclusiveLockEnabled;
    }

    public ZoneStatus getStatus() {
        return status;
    }

    public void setStatus(ZoneStatus status) {
        this.status = status;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WorkZone workZone)) return false;
        return Objects.equals(id, workZone.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
