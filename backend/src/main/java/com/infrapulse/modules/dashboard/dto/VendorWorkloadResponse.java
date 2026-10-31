package com.infrapulse.modules.dashboard.dto;

import java.util.List;

public record VendorWorkloadResponse(
    List<VendorWorkloadItem> vendors
) {}
