import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { OverviewPage } from '../pages/OverviewPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { WorkZonesPage } from '../pages/WorkZonesPage';
import { WorkAllocationPage } from '../pages/WorkAllocationPage';
import { WorkAssignmentDetailPage } from '../pages/WorkAssignmentDetailPage';
import { WorkDependenciesPage } from '../pages/WorkDependenciesPage';
import { VendorWorkPage } from '../pages/VendorWorkPage';
import { VendorsPage } from '../pages/VendorsPage';
import { VendorDetailPage } from '../pages/VendorDetailPage';
import { QualityInspectionPage } from '../pages/QualityInspectionPage';
import { HumanReviewQueuePage } from '../pages/HumanReviewQueuePage';
import { InspectionWorkspacePage } from '../pages/InspectionWorkspacePage';
import { CorrectiveActionsPage } from '../pages/CorrectiveActionsPage';
import { VendorCorrectiveActionsPage } from '../pages/VendorCorrectiveActionsPage';
import { EvidencePage } from '../pages/EvidencePage';
import { MilestonesPage } from '../pages/MilestonesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { AuditTrailPage } from '../pages/AuditTrailPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { PermissionGuard } from '../auth/PermissionGuard';
import { useAuth } from '../auth/useAuth';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const getRoleLandingRoute = (role?: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN': return '/overview';
      case 'PROJECT_MANAGER': return '/overview';
      case 'VENDOR': return '/my-work';
      case 'FIELD_ENGINEER': return '/quality-inspection';
      case 'FINANCE_OFFICER': return '/milestones';
      default: return '/overview';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated 
            ? <Navigate to={getRoleLandingRoute(user?.role)} replace /> 
            : <LoginPage />
        } 
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />

          {/* Overview */}
          <Route 
            path="overview" 
            element={
              <PermissionGuard requiredPermission="VIEW_OVERVIEW">
                <OverviewPage />
              </PermissionGuard>
            } 
          />

          {/* Projects */}
          <Route 
            path="projects" 
            element={
              <PermissionGuard requiredPermission="VIEW_PROJECTS">
                <ProjectsPage />
              </PermissionGuard>
            } 
          />
          <Route 
            path="projects/:id" 
            element={
              <PermissionGuard requiredPermission="VIEW_PROJECTS">
                <ProjectDetailPage />
              </PermissionGuard>
            } 
          />

          {/* Work Zones */}
          <Route 
            path="work-zones" 
            element={
              <PermissionGuard requiredPermission="VIEW_WORK_ZONES">
                <WorkZonesPage />
              </PermissionGuard>
            } 
          />

          {/* Work Allocation Ledger & Creation */}
          <Route 
            path="work-allocation" 
            element={
              <PermissionGuard requiredPermission="VIEW_ASSIGNED_WORK">
                <WorkAllocationPage />
              </PermissionGuard>
            } 
          />
          <Route 
            path="work-allocation/:id" 
            element={
              <PermissionGuard requiredPermission="VIEW_ASSIGNED_WORK">
                <WorkAssignmentDetailPage />
              </PermissionGuard>
            } 
          />

          {/* Stage 6 Work Type Dependencies */}
          <Route 
            path="work-dependencies" 
            element={
              <PermissionGuard requiredPermission="DEPENDENCY_VIEW">
                <WorkDependenciesPage />
              </PermissionGuard>
            } 
          />

          {/* Vendor Portal: My Work Orders */}
          <Route 
            path="my-work" 
            element={
              <PermissionGuard requiredPermission="VIEW_ASSIGNED_WORK">
                <VendorWorkPage />
              </PermissionGuard>
            } 
          />

          {/* Vendors */}
          <Route 
            path="vendors" 
            element={
              <PermissionGuard requiredPermission="VENDOR_VIEW">
                <VendorsPage />
              </PermissionGuard>
            } 
          />
          <Route 
            path="vendors/:id" 
            element={
              <PermissionGuard requiredPermission="VENDOR_VIEW">
                <VendorDetailPage />
              </PermissionGuard>
            } 
          />

          {/* Quality Inspection */}
          <Route 
            path="quality-inspection" 
            element={
              <PermissionGuard requiredPermission="REVIEW_EVIDENCE">
                <QualityInspectionPage />
              </PermissionGuard>
            } 
          />

          {/* Stage 11: Human Review Queue & Inspection Workspace */}
          <Route 
            path="human-review" 
            element={
              <PermissionGuard requiredPermission="REVIEW_EVIDENCE">
                <HumanReviewQueuePage />
              </PermissionGuard>
            } 
          />
          <Route 
            path="human-review/:reviewId" 
            element={
              <PermissionGuard requiredPermission="REVIEW_EVIDENCE">
                <InspectionWorkspacePage />
              </PermissionGuard>
            } 
          />

          {/* Stage 11: Corrective Actions */}
          <Route 
            path="corrective-actions" 
            element={
              <PermissionGuard requiredPermission="REVIEW_EVIDENCE">
                <CorrectiveActionsPage />
              </PermissionGuard>
            } 
          />
          <Route 
            path="my-corrective-actions" 
            element={
              <PermissionGuard requiredPermission="VIEW_ASSIGNED_WORK">
                <VendorCorrectiveActionsPage />
              </PermissionGuard>
            } 
          />

          {/* Evidence Center */}
          <Route 
            path="evidence" 
            element={
              <PermissionGuard requiredPermission="SUBMIT_EVIDENCE">
                <EvidencePage />
              </PermissionGuard>
            } 
          />

          {/* Milestones & Payments */}
          <Route 
            path="milestones" 
            element={
              <PermissionGuard requiredPermission="VIEW_MILESTONES">
                <MilestonesPage />
              </PermissionGuard>
            } 
          />

          {/* Analytics */}
          <Route 
            path="analytics" 
            element={
              <PermissionGuard requiredPermission="VIEW_AUDIT_TRAIL">
                <AnalyticsPage />
              </PermissionGuard>
            } 
          />

          {/* Audit Trail */}
          <Route 
            path="audit-trail" 
            element={
              <PermissionGuard requiredPermission="VIEW_AUDIT_TRAIL">
                <AuditTrailPage />
              </PermissionGuard>
            } 
          />

          {/* User Management (Platform Admin Only) */}
          <Route 
            path="users" 
            element={
              <PermissionGuard requiredPermission="MANAGE_USERS">
                <UserManagementPage />
              </PermissionGuard>
            } 
          />

          {/* Operator Profile */}
          <Route path="profile" element={<ProfilePage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
