package com.infrapulse.common.exception;

import com.infrapulse.modules.workdependency.dto.BlockedDependencyDetail;
import com.infrapulse.modules.workdependency.dto.SchedulingConflictDetail;
import org.springframework.http.HttpStatus;

import java.util.List;

public class DependencyValidationException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final List<BlockedDependencyDetail> blockedDependencies;
    private final List<SchedulingConflictDetail> schedulingConflicts;

    public DependencyValidationException(
        String code,
        String message,
        List<BlockedDependencyDetail> blockedDependencies,
        List<SchedulingConflictDetail> schedulingConflicts
    ) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.code = code;
        this.blockedDependencies = blockedDependencies != null ? blockedDependencies : List.of();
        this.schedulingConflicts = schedulingConflicts != null ? schedulingConflicts : List.of();
    }

    public DependencyValidationException(
        HttpStatus status,
        String code,
        String message,
        List<BlockedDependencyDetail> blockedDependencies,
        List<SchedulingConflictDetail> schedulingConflicts
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.blockedDependencies = blockedDependencies != null ? blockedDependencies : List.of();
        this.schedulingConflicts = schedulingConflicts != null ? schedulingConflicts : List.of();
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public List<BlockedDependencyDetail> getBlockedDependencies() {
        return blockedDependencies;
    }

    public List<SchedulingConflictDetail> getSchedulingConflicts() {
        return schedulingConflicts;
    }
}
