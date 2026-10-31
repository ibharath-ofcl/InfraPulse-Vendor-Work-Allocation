package com.infrapulse.modules.finance.dto;

import jakarta.validation.constraints.NotBlank;

public class SubmitClarificationRequest {

    @NotBlank(message = "Clarification text is required")
    private String clarification;

    private String supportingDocumentUrl;

    public String getClarification() {
        return clarification;
    }

    public void setClarification(String clarification) {
        this.clarification = clarification;
    }

    public String getSupportingDocumentUrl() {
        return supportingDocumentUrl;
    }

    public void setSupportingDocumentUrl(String supportingDocumentUrl) {
        this.supportingDocumentUrl = supportingDocumentUrl;
    }
}
