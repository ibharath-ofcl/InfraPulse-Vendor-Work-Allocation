package com.infrapulse.modules.auth.model;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum UserRole {
    PLATFORM_ADMIN(EnumSet.allOf(Permission.class)),
    
    PROJECT_MANAGER(EnumSet.of(
        Permission.VIEW_OVERVIEW,
        Permission.MANAGE_PROJECTS,
        Permission.VIEW_PROJECTS,
        Permission.VIEW_WORK_ZONES,
        Permission.ALLOCATE_WORK,
        Permission.VIEW_ASSIGNED_WORK,
        Permission.VIEW_MILESTONES,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.PROJECT_UPDATE,
        Permission.PROJECT_VENDOR_ASSOCIATE,
        Permission.VENDOR_VIEW,
        Permission.VENDOR_PROJECT_ASSOCIATE,
        Permission.WORK_ZONE_VIEW,
        Permission.WORK_ZONE_CREATE,
        Permission.WORK_ZONE_UPDATE,
        Permission.WORK_ZONE_STATUS_MANAGE,
        Permission.WORK_ASSIGNMENT_VIEW,
        Permission.WORK_ASSIGNMENT_CREATE,
        Permission.WORK_ASSIGNMENT_UPDATE,
        Permission.WORK_ASSIGNMENT_CANCEL,
        Permission.WORK_ASSIGNMENT_RELEASE,
        Permission.WORK_ASSIGNMENT_COMPLETE,
        Permission.DEPENDENCY_VIEW,
        Permission.SUBMIT_EVIDENCE,
        Permission.REVIEW_EVIDENCE,
        Permission.APPROVE_QUALITY_REVIEW,
        Permission.VIEW_AGREEMENTS,
        Permission.MANAGE_AGREEMENTS,
        Permission.MANAGE_MILESTONES,
        Permission.REVIEW_PAYMENT_REQUEST,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_REPORTS,
        Permission.WORKER_VIEW,
        Permission.WORKER_VERIFY,
        Permission.WORKER_APPROVE,
        Permission.WORKER_ASSIGN,
        Permission.WORKER_SITE_ACCESS,
        Permission.WORKER_SAFETY,
        Permission.WORKER_HEADCOUNT,
        Permission.WORKER_ANALYTICS
    )),
    
    VENDOR(EnumSet.of(
        Permission.VIEW_ASSIGNED_WORK,
        Permission.SUBMIT_EVIDENCE,
        Permission.VIEW_MILESTONES,
        Permission.VIEW_PROJECTS,
        Permission.VENDOR_VIEW,
        Permission.WORK_ZONE_VIEW,
        Permission.WORK_ASSIGNMENT_VIEW,
        Permission.WORK_ASSIGNMENT_ACCEPT,
        Permission.WORK_ASSIGNMENT_REJECT,
        Permission.WORK_ASSIGNMENT_START,
        Permission.WORK_ASSIGNMENT_COMPLETE,
        Permission.DEPENDENCY_VIEW,
        Permission.VIEW_AGREEMENTS,
        Permission.SUBMIT_PAYMENT_REQUEST,
        Permission.VIEW_ANALYTICS,
        Permission.WORKER_VIEW,
        Permission.WORKER_REGISTER,
        Permission.WORKER_SAFETY
    )),
    
    FIELD_ENGINEER(EnumSet.of(
        Permission.VIEW_OVERVIEW,
        Permission.VIEW_PROJECTS,
        Permission.VIEW_WORK_ZONES,
        Permission.VIEW_ASSIGNED_WORK,
        Permission.REVIEW_EVIDENCE,
        Permission.APPROVE_QUALITY_REVIEW,
        Permission.VIEW_MILESTONES,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.VENDOR_VIEW,
        Permission.WORK_ZONE_VIEW,
        Permission.WORK_ASSIGNMENT_VIEW,
        Permission.WORK_ASSIGNMENT_RELEASE,
        Permission.DEPENDENCY_VIEW,
        Permission.VIEW_AGREEMENTS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_REPORTS,
        Permission.WORKER_VIEW,
        Permission.WORKER_SITE_ACCESS,
        Permission.WORKER_SAFETY,
        Permission.WORKER_HEADCOUNT
    )),
    
    FINANCE_OFFICER(EnumSet.of(
        Permission.VIEW_OVERVIEW,
        Permission.VIEW_PROJECTS,
        Permission.VIEW_WORK_ZONES,
        Permission.VIEW_MILESTONES,
        Permission.AUTHORIZE_PAYMENTS,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.VENDOR_VIEW,
        Permission.WORK_ZONE_VIEW,
        Permission.WORK_ASSIGNMENT_VIEW,
        Permission.DEPENDENCY_VIEW,
        Permission.VIEW_AGREEMENTS,
        Permission.REVIEW_PAYMENT_REQUEST,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_REPORTS,
        Permission.WORKER_VIEW,
        Permission.WORKER_ANALYTICS
    ));


    private final Set<Permission> permissions;

    UserRole(Set<Permission> permissions) {
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }
}
