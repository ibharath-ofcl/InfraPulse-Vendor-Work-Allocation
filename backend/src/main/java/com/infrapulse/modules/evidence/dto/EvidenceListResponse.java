package com.infrapulse.modules.evidence.dto;

import java.util.List;

public class EvidenceListResponse {

    private List<EvidenceDetailResponse> evidence;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public EvidenceListResponse() {}

    public EvidenceListResponse(List<EvidenceDetailResponse> evidence, int page, int size, long totalElements, int totalPages) {
        this.evidence = evidence;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<EvidenceDetailResponse> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<EvidenceDetailResponse> evidence) {
        this.evidence = evidence;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
