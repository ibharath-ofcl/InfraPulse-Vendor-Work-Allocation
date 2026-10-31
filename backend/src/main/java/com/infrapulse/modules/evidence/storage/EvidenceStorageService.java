package com.infrapulse.modules.evidence.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

public interface EvidenceStorageService {

    /**
     * Stores an uploaded multipart file securely and returns the storage key.
     */
    StoredFileResult store(MultipartFile file, String assignmentId) throws IOException;

    /**
     * Stores a byte array or stream (e.g. generated preview) and returns the storage key.
     */
    String storePreview(byte[] previewData, String assignmentId, String originalKey, String format) throws IOException;

    /**
     * Retrieves the stored file as a Spring Resource for authenticated download/streaming.
     */
    Resource retrieve(String storageKey) throws IOException;

    /**
     * Deletes a stored file by its key.
     */
    boolean delete(String storageKey);

    /**
     * Computes the SHA-256 checksum of the stored file.
     */
    String calculateChecksum(String storageKey) throws IOException;

    /**
     * Verifies that the stored file's current SHA-256 matches expected checksum.
     */
    boolean verifyIntegrity(String storageKey, String expectedChecksum);

    record StoredFileResult(
            String storageKey,
            String sha256Checksum,
            long fileSize,
            String mimeType,
            String originalFileName
    ) {}
}
