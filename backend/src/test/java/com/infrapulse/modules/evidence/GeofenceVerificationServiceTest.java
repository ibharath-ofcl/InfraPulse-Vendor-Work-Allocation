package com.infrapulse.modules.evidence;

import com.infrapulse.modules.evidence.model.GeofenceStatus;
import com.infrapulse.modules.evidence.service.GeofenceVerificationService;
import com.infrapulse.modules.workzone.entity.WorkZone;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class GeofenceVerificationServiceTest {

    private GeofenceVerificationService geofenceService;
    private WorkZone zone;

    @BeforeEach
    void setUp() {
        geofenceService = new GeofenceVerificationService();
        zone = new WorkZone();
        // MG Road, Bengaluru center coordinates
        zone.setCenterLatitude(new BigDecimal("12.975600"));
        zone.setCenterLongitude(new BigDecimal("77.606600"));
        zone.setGeofenceRadiusMeters(500);
    }

    @Test
    @DisplayName("Point within geofence radius with good accuracy returns VERIFIED")
    void testGeofenceVerifiedWithinRadius() {
        // ~50 meters away from center
        BigDecimal reportedLat = new BigDecimal("12.975800");
        BigDecimal reportedLng = new BigDecimal("77.606700");
        BigDecimal accuracy = new BigDecimal("8.5");

        GeofenceVerificationService.GeofenceVerificationResult result =
                geofenceService.verifyGeofence(reportedLat, reportedLng, accuracy, zone);

        assertEquals(GeofenceStatus.VERIFIED, result.status());
        assertNotNull(result.distanceMeters());
        assertTrue(result.distanceMeters().doubleValue() < 500.0);
    }

    @Test
    @DisplayName("Point outside geofence radius returns OUT_OF_BOUNDS")
    void testGeofenceOutOfBounds() {
        // ~5 kilometers away (e.g. Koramangala)
        BigDecimal reportedLat = new BigDecimal("12.935200");
        BigDecimal reportedLng = new BigDecimal("77.624500");
        BigDecimal accuracy = new BigDecimal("10.0");

        GeofenceVerificationService.GeofenceVerificationResult result =
                geofenceService.verifyGeofence(reportedLat, reportedLng, accuracy, zone);

        assertEquals(GeofenceStatus.OUT_OF_BOUNDS, result.status());
        assertNotNull(result.distanceMeters());
        assertTrue(result.distanceMeters().doubleValue() > 500.0);
    }

    @Test
    @DisplayName("GPS accuracy > 50 meters returns ACCURACY_TOO_LOW")
    void testGeofenceAccuracyTooLow() {
        // Coordinates near center, but degraded GPS accuracy of 85m
        BigDecimal reportedLat = new BigDecimal("12.975610");
        BigDecimal reportedLng = new BigDecimal("77.606610");
        BigDecimal accuracy = new BigDecimal("85.0");

        GeofenceVerificationService.GeofenceVerificationResult result =
                geofenceService.verifyGeofence(reportedLat, reportedLng, accuracy, zone);

        assertEquals(GeofenceStatus.ACCURACY_TOO_LOW, result.status());
    }

    @Test
    @DisplayName("Null reported coordinates returns UNVERIFIED_NO_GPS")
    void testGeofenceNoGpsCoordinates() {
        GeofenceVerificationService.GeofenceVerificationResult result =
                geofenceService.verifyGeofence(null, null, null, zone);

        assertEquals(GeofenceStatus.UNVERIFIED_NO_GPS, result.status());
        assertNull(result.distanceMeters());
    }

    @Test
    @DisplayName("Work zone without center coordinates returns UNVERIFIED_NO_GPS")
    void testGeofenceMissingZoneCoordinates() {
        WorkZone unlocatedZone = new WorkZone();
        unlocatedZone.setCenterLatitude(null);
        unlocatedZone.setCenterLongitude(null);

        GeofenceVerificationService.GeofenceVerificationResult result =
                geofenceService.verifyGeofence(new BigDecimal("12.975600"), new BigDecimal("77.606600"), new BigDecimal("5.0"), unlocatedZone);

        assertEquals(GeofenceStatus.UNVERIFIED_NO_GPS, result.status());
    }
}
