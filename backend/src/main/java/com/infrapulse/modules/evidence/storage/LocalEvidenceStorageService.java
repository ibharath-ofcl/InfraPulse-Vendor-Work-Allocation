package com.infrapulse.modules.evidence.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.nio.file.*;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class LocalEvidenceStorageService implements EvidenceStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalEvidenceStorageService.class);

    private final Path rootLocation;

    public LocalEvidenceStorageService(@Value("${evidence.storage.local-dir:uploads/evidence}") String localDir) {
        this.rootLocation = Paths.get(localDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("Initialized local evidence storage directory at: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + rootLocation, e);
        }
    }

    @Override
    public StoredFileResult store(MultipartFile file, String assignmentId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Failed to store empty file.");
        }

        String rawFilename = file.getOriginalFilename();
        String safeExtension = getSafeExtension(rawFilename, file.getContentType());
        String uniqueFileName = UUID.randomUUID().toString() + safeExtension;

        LocalDate now = LocalDate.now();
        String relativeSubDir = String.format("%d/%02d/%s", now.getYear(), now.getMonthValue(), sanitizeDirName(assignmentId));
        Path targetDir = this.rootLocation.resolve(relativeSubDir).normalize();

        // Enforce path traversal protection
        if (!targetDir.startsWith(this.rootLocation)) {
            throw new SecurityException("Cannot store file outside current storage directory.");
        }

        Files.createDirectories(targetDir);
        Path targetPath = targetDir.resolve(uniqueFileName).normalize();
        if (!targetPath.startsWith(this.rootLocation)) {
            throw new SecurityException("Cannot store file outside current storage directory.");
        }

        MessageDigest md;
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }

        long bytesWritten;
        try (InputStream inputStream = file.getInputStream();
             DigestInputStream dis = new DigestInputStream(inputStream, md);
             OutputStream os = Files.newOutputStream(targetPath, StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
            bytesWritten = dis.transferTo(os);
        }

        String sha256Checksum = HexFormat.of().formatHex(md.digest());
        String storageKey = relativeSubDir + "/" + uniqueFileName;

        log.info("Evidence file stored successfully: key={}, size={}, sha256={}", storageKey, bytesWritten, sha256Checksum);

        return new StoredFileResult(
                storageKey,
                sha256Checksum,
                bytesWritten,
                file.getContentType(),
                rawFilename != null ? Paths.get(rawFilename).getFileName().toString() : uniqueFileName
        );
    }

    @Override
    public String storePreview(byte[] previewData, String assignmentId, String originalKey, String format) throws IOException {
        LocalDate now = LocalDate.now();
        String relativeSubDir = String.format("%d/%02d/%s/previews", now.getYear(), now.getMonthValue(), sanitizeDirName(assignmentId));
        Path targetDir = this.rootLocation.resolve(relativeSubDir).normalize();

        if (!targetDir.startsWith(this.rootLocation)) {
            throw new SecurityException("Cannot store preview outside current storage directory.");
        }

        Files.createDirectories(targetDir);
        String previewFileName = UUID.randomUUID().toString() + "_preview." + format;
        Path targetPath = targetDir.resolve(previewFileName).normalize();

        if (!targetPath.startsWith(this.rootLocation)) {
            throw new SecurityException("Cannot store preview outside current storage directory.");
        }

        Files.write(targetPath, previewData, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
        String previewKey = relativeSubDir + "/" + previewFileName;
        log.info("Evidence preview stored: key={}, size={}", previewKey, previewData.length);
        return previewKey;
    }

    @Override
    public Resource retrieve(String storageKey) throws IOException {
        Path filePath = resolveAndValidate(storageKey);
        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            throw new FileNotFoundException("Evidence file not found or unreadable: " + storageKey);
        }
        return new UrlResource(filePath.toUri());
    }

    @Override
    public boolean delete(String storageKey) {
        try {
            Path filePath = resolveAndValidate(storageKey);
            return Files.deleteIfExists(filePath);
        } catch (Exception e) {
            log.warn("Failed to delete stored evidence file: key={}, error={}", storageKey, e.getMessage());
            return false;
        }
    }

    @Override
    public String calculateChecksum(String storageKey) throws IOException {
        Path filePath = resolveAndValidate(storageKey);
        try (InputStream is = Files.newInputStream(filePath)) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) != -1) {
                md.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @Override
    public boolean verifyIntegrity(String storageKey, String expectedChecksum) {
        if (expectedChecksum == null || expectedChecksum.isBlank()) {
            return false;
        }
        try {
            String currentChecksum = calculateChecksum(storageKey);
            boolean match = currentChecksum.equalsIgnoreCase(expectedChecksum.trim());
            if (!match) {
                log.error("Integrity check failed for key: {}. Expected: {}, Actual: {}", storageKey, expectedChecksum, currentChecksum);
            }
            return match;
        } catch (Exception e) {
            log.error("Integrity verification error for key: {}: {}", storageKey, e.getMessage());
            return false;
        }
    }

    private Path resolveAndValidate(String storageKey) {
        if (storageKey == null || storageKey.isBlank() || storageKey.contains("..")) {
            throw new SecurityException("Invalid storage key path: " + storageKey);
        }
        Path resolved = this.rootLocation.resolve(storageKey).normalize();
        if (!resolved.startsWith(this.rootLocation)) {
            throw new SecurityException("Storage key resolves outside authorized directory: " + storageKey);
        }
        return resolved;
    }

    private String sanitizeDirName(String name) {
        if (name == null) return "common";
        return name.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private String getSafeExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp")) {
                return ext;
            }
        }
        if (contentType != null) {
            if (contentType.equalsIgnoreCase("image/jpeg")) return ".jpg";
            if (contentType.equalsIgnoreCase("image/png")) return ".png";
            if (contentType.equalsIgnoreCase("image/webp")) return ".webp";
        }
        return ".jpg";
    }
}
