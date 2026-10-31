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
        Permission.WORK_ASSIGNMENT_CANCEL
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
        Permission.WORK_ASSIGNMENT_START
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
        Permission.WORK_ASSIGNMENT_VIEW
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
        Permission.WORK_ASSIGNMENT_VIEW
    ));

    private final Set<Permission> permissions;

    UserRole(Set<Permission> permissions) {
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }
}
