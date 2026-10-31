import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { OverviewPage } from '../pages/OverviewPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { WorkZonesPage } from '../pages/WorkZonesPage';
import { WorkAllocationPage } from '../pages/WorkAllocationPage';
import { VendorsPage } from '../pages/VendorsPage';
import { QualityInspectionPage } from '../pages/QualityInspectionPage';
import { EvidencePage } from '../pages/EvidencePage';
import { MilestonesPage } from '../pages/MilestonesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { AuditTrailPage } from '../pages/AuditTrailPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="work-zones" element={<WorkZonesPage />} />
        <Route path="work-allocation" element={<WorkAllocationPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="quality-inspection" element={<QualityInspectionPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="milestones" element={<MilestonesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
