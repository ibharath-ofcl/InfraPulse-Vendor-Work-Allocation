package com.infrapulse.modules.evidence.service;

import com.infrapulse.modules.evidence.model.GeofenceStatus;
import com.infrapulse.modules.workzone.entity.WorkZone;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class GeofenceVerificationService {

    private static final Logger log = LoggerFactory.getLogger(GeofenceVerificationService.class);
    private static final double MAX_PERMITTED_ACCURACY_METERS = 50.0;
    private static final double EARTH_RADIUS_METERS = 6371000.0;

    public record GeofenceVerificationResult(
            GeofenceStatus status,
            BigDecimal distanceMeters,
            String message
    ) {}

    public GeofenceVerificationResult verifyGeofence(
            BigDecimal reportedLat,
            BigDecimal reportedLng,
            BigDecimal gpsAccuracyMeters,
            WorkZone workZone
    ) {
        if (reportedLat == null || reportedLng == null) {
            return new GeofenceVerificationResult(
                    GeofenceStatus.UNVERIFIED_NO_GPS,
                    null,
                    "No GPS coordinates provided with submission. Browser geolocation is unverified."
            );
        }

        if (workZone == null || workZone.getCenterLatitude() == null || workZone.getCenterLongitude() == null) {
            return new GeofenceVerificationResult(
                    GeofenceStatus.UNVERIFIED_NO_GPS,
                    null,
                    "Work zone does not have reference center coordinates configured for geofence validation."
            );
        }

        double lat1 = Math.toRadians(reportedLat.doubleValue());
        double lon1 = Math.toRadians(reportedLng.doubleValue());
        double lat2 = Math.toRadians(workZone.getCenterLatitude().doubleValue());
        double lon2 = Math.toRadians(workZone.getCenterLongitude().doubleValue());

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_METERS * c;

        BigDecimal distanceRounded = BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP);

        // Check 1: GPS Accuracy Evaluation
        if (gpsAccuracyMeters != null && gpsAccuracyMeters.doubleValue() > MAX_PERMITTED_ACCURACY_METERS) {
            String msg = String.format("GPS accuracy (±%.1fm) is too poor for verified infrastructure presence (limit: %.0fm). Reported location flagged.",
                    gpsAccuracyMeters.doubleValue(), MAX_PERMITTED_ACCURACY_METERS);
            log.warn("Poor GPS accuracy for zone {}: {}", workZone.getZoneCode(), msg);
            return new GeofenceVerificationResult(GeofenceStatus.ACCURACY_TOO_LOW, distanceRounded, msg);
        }

        // Check 2: Boundary Tolerance Evaluation
        int maxRadius = workZone.getGeofenceRadiusMeters() != null ? workZone.getGeofenceRadiusMeters() : 500;
        if (distance > maxRadius) {
            String msg = String.format("Reported location is %.1fm away from work zone center, exceeding the authorized geofence tolerance (%dm).",
                    distance, maxRadius);
            log.warn("Geofence boundary breach for zone {}: {}", workZone.getZoneCode(), msg);
            return new GeofenceVerificationResult(GeofenceStatus.OUT_OF_BOUNDS, distanceRounded, msg);
        }

        String msg = String.format("GPS verified within authorized work zone tolerance (%.1fm from center, accuracy: %s).",
                distance, gpsAccuracyMeters != null ? "±" + gpsAccuracyMeters.toPlainString() + "m" : "standard");
        log.info("Geofence verified for zone {}: {}", workZone.getZoneCode(), msg);
        return new GeofenceVerificationResult(GeofenceStatus.VERIFIED, distanceRounded, msg);
    }
}
