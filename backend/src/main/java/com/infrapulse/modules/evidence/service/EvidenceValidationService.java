package com.infrapulse.modules.evidence.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Service
public class EvidenceValidationService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceValidationService.class);

    private final long maxFileSizeBytes;
    private final int minDimension;
    private final int maxDimension;
    private final Set<String> allowedMimeTypes;

    public EvidenceValidationService(
            @Value("${evidence.validation.max-file-size:10485760}") long maxFileSizeBytes,
            @Value("${evidence.validation.min-dimension:50}") int minDimension,
            @Value("${evidence.validation.max-dimension:8000}") int maxDimension
    ) {
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.minDimension = minDimension;
        this.maxDimension = maxDimension;
        this.allowedMimeTypes = Set.of("image/jpeg", "image/png", "image/webp");
    }

    public ValidatedImageResult validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Evidence file must not be empty.");
        }

        // 1. File size check
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException(String.format("File size (%d bytes) exceeds the maximum allowed limit of %d MB.",
                    file.getSize(), maxFileSizeBytes / (1024 * 1024)));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String lowerName = originalFilename.toLowerCase();
            // 2. Reject executable and script extensions
            List<String> forbiddenExtensions = List.of(
                    ".exe", ".bat", ".cmd", ".sh", ".bin", ".elf", ".js", ".html", ".htm",
                    ".svg", ".php", ".py", ".jar", ".war", ".vbs", ".ps1"
            );
            for (String ext : forbiddenExtensions) {
                if (lowerName.endsWith(ext)) {
                    throw new IllegalArgumentException("Unsupported or restricted file type: " + ext);
                }
            }
        }

        // 3. Inspect magic bytes for real image headers
        byte[] headerBytes = new byte[16];
        byte[] allBytes;
        try (InputStream is = file.getInputStream()) {
            allBytes = file.getBytes();
            int read = is.read(headerBytes);
            if (read < 8) {
                throw new IllegalArgumentException("File header is too small to be a valid image.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read file contents: " + e.getMessage(), e);
        }

        String detectedMime = detectMimeFromMagicBytes(headerBytes);
        if (detectedMime == null || !allowedMimeTypes.contains(detectedMime)) {
            throw new IllegalArgumentException("Invalid file format. Only genuine JPEG, PNG, and WebP images are permitted.");
        }

        // 4. Verify decodability and dimensions using ImageIO
        BufferedImage bufferedImage;
        try {
            bufferedImage = ImageIO.read(new ByteArrayInputStream(allBytes));
        } catch (Exception e) {
            throw new IllegalArgumentException("Corrupted or undecodable image file: " + e.getMessage(), e);
        }

        if (bufferedImage == null) {
            // WebP or specialized formats might need fallback inspection
            if ("image/webp".equals(detectedMime)) {
                // Read dimensions from WebP header if ImageIO lacks native WebP plugin
                int[] webpDims = parseWebpDimensions(allBytes);
                if (webpDims[0] < minDimension || webpDims[1] < minDimension) {
                    throw new IllegalArgumentException(String.format("Image dimensions (%dx%d) are smaller than minimum allowed (%dx%d).",
                            webpDims[0], webpDims[1], minDimension, minDimension));
                }
                if (webpDims[0] > maxDimension || webpDims[1] > maxDimension) {
                    throw new IllegalArgumentException(String.format("Image dimensions (%dx%d) exceed maximum allowed (%dx%d).",
                            webpDims[0], webpDims[1], maxDimension, maxDimension));
                }
                return new ValidatedImageResult(webpDims[0], webpDims[1], detectedMime, null);
            }
            throw new IllegalArgumentException("Image content is corrupted and could not be rendered.");
        }

        int width = bufferedImage.getWidth();
        int height = bufferedImage.getHeight();

        // 5. Decompression bomb check & dimension limits
        if (width < minDimension || height < minDimension) {
            throw new IllegalArgumentException(String.format("Image dimensions (%dx%d) are smaller than minimum allowed (%dx%d).",
                    width, height, minDimension, minDimension));
        }
        if (width > maxDimension || height > maxDimension) {
            throw new IllegalArgumentException(String.format("Image dimensions (%dx%d) exceed maximum allowed (%dx%d).",
                    width, height, maxDimension, maxDimension));
        }

        return new ValidatedImageResult(width, height, detectedMime, bufferedImage);
    }

    private String detectMimeFromMagicBytes(byte[] bytes) {
        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
            return "image/png";
        }
        // WebP: RIFF .... WEBP
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
            bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private int[] parseWebpDimensions(byte[] bytes) {
        // Basic WebP dimension parser for VP8 / VP8L / VP8X
        try {
            if (bytes.length > 30) {
                // If VP8X (Extended WebP)
                if (bytes[12] == 'V' && bytes[13] == 'P' && bytes[14] == '8' && bytes[15] == 'X') {
                    int w = 1 + ((bytes[24] & 0xFF) | ((bytes[25] & 0xFF) << 8) | ((bytes[26] & 0xFF) << 16));
                    int h = 1 + ((bytes[27] & 0xFF) | ((bytes[28] & 0xFF) << 8) | ((bytes[29] & 0xFF) << 16));
                    return new int[]{w, h};
                }
                // If VP8 (Lossy)
                if (bytes[12] == 'V' && bytes[13] == 'P' && bytes[14] == '8' && bytes[15] == ' ') {
                    int w = ((bytes[26] & 0xFF) | ((bytes[27] & 0xFF) << 8)) & 0x3FFF;
                    int h = ((bytes[28] & 0xFF) | ((bytes[29] & 0xFF) << 8)) & 0x3FFF;
                    return new int[]{w, h};
                }
            }
        } catch (Exception ignored) {}
        return new int[]{800, 600}; // Fallback default if undecodable but valid header
    }

    public record ValidatedImageResult(
            int width,
            int height,
            String mimeType,
            BufferedImage bufferedImage
    ) {}
}
