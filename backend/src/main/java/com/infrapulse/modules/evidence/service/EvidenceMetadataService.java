package com.infrapulse.modules.evidence.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class EvidenceMetadataService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceMetadataService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExtractedMetadata extractMetadata(byte[] fileBytes, BufferedImage image, String mimeType) {
        Instant captureTimestamp = null;
        BigDecimal latitude = null;
        BigDecimal longitude = null;
        Integer orientation = null;
        String cameraMake = null;
        String cameraModel = null;
        Map<String, Object> metadataMap = new HashMap<>();

        metadataMap.put("mimeType", mimeType);
        if (image != null) {
            metadataMap.put("width", image.getWidth());
            metadataMap.put("height", image.getHeight());
        }

        try (ByteArrayInputStream bais = new ByteArrayInputStream(fileBytes)) {
            Metadata metadata = ImageMetadataReader.readMetadata(bais);

            // 1. Exif SubIFD (Date/Time Original)
            ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (subIfd != null) {
                Date date = subIfd.getDateOriginal();
                if (date != null) {
                    captureTimestamp = date.toInstant();
                    metadataMap.put("exifCaptureDate", date.toString());
                }
            }

            // 2. Exif IFD0 (Make, Model, Orientation)
            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (ifd0 != null) {
                if (ifd0.containsTag(ExifIFD0Directory.TAG_MAKE)) {
                    cameraMake = ifd0.getString(ExifIFD0Directory.TAG_MAKE);
                    metadataMap.put("cameraMake", cameraMake);
                }
                if (ifd0.containsTag(ExifIFD0Directory.TAG_MODEL)) {
                    cameraModel = ifd0.getString(ExifIFD0Directory.TAG_MODEL);
                    metadataMap.put("cameraModel", cameraModel);
                }
                if (ifd0.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                    orientation = ifd0.getInteger(ExifIFD0Directory.TAG_ORIENTATION);
                    metadataMap.put("orientation", orientation);
                }
            }

            // 3. GPS Directory
            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null && gps.getGeoLocation() != null) {
                var geoLocation = gps.getGeoLocation();
                latitude = BigDecimal.valueOf(geoLocation.getLatitude()).setScale(6, RoundingMode.HALF_UP);
                longitude = BigDecimal.valueOf(geoLocation.getLongitude()).setScale(6, RoundingMode.HALF_UP);
                metadataMap.put("gpsLatitude", latitude);
                metadataMap.put("gpsLongitude", longitude);
                metadataMap.put("hasExifGps", true);
            } else {
                metadataMap.put("hasExifGps", false);
            }

        } catch (Exception e) {
            log.debug("No EXIF metadata could be read from image: {}", e.getMessage());
            metadataMap.put("exifStatus", "NOT_AVAILABLE");
        }

        String metadataJson = "{}";
        try {
            metadataJson = objectMapper.writeValueAsString(metadataMap);
        } catch (Exception e) {
            log.warn("Failed to serialize metadata to JSON: {}", e.getMessage());
        }

        return new ExtractedMetadata(captureTimestamp, latitude, longitude, orientation, cameraMake, cameraModel, metadataJson);
    }

    public byte[] generateThumbnail(BufferedImage original, int maxDimension) {
        if (original == null) {
            return null;
        }

        int origW = original.getWidth();
        int origH = original.getHeight();

        int targetW = origW;
        int targetH = origH;

        if (origW > maxDimension || origH > maxDimension) {
            if (origW > origH) {
                targetW = maxDimension;
                targetH = (int) Math.round((double) origH * maxDimension / origW);
            } else {
                targetH = maxDimension;
                targetW = (int) Math.round((double) origW * maxDimension / origH);
            }
        }

        BufferedImage thumbnail = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = thumbnail.createGraphics();
        try {
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.drawImage(original, 0, 0, targetW, targetH, null);
        } finally {
            g2d.dispose();
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(thumbnail, "jpg", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            log.warn("Failed to generate preview thumbnail: {}", e.getMessage());
            return null;
        }
    }

    public record ExtractedMetadata(
            Instant captureTimestamp,
            BigDecimal latitude,
            BigDecimal longitude,
            Integer orientation,
            String cameraMake,
            String cameraModel,
            String metadataJson
    ) {}
}
