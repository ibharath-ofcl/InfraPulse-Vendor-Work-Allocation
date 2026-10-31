package com.infrapulse.modules.dashboard.dto;

import java.util.Set;

public record VendorWorkloadItem(
    String vendorId,
    String vendorCode,
    String companyName,
    String contactPerson,
    String status,
    long activeAssignments,
    long completedAssignments,
    long pendingAcceptance,
    long blockedAssignments,
    long rejectedAssignments,
    long currentWorkload,
    Set<String> serviceCategories
) {}
