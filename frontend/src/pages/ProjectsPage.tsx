import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  MapPin, 
  Calendar, 
  Coins, 
  Users, 
  ChevronRight 
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { SearchInput } from '../components/common/SearchInput';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { mockProjects } from '../data/mockProjects';
import { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectModal, setNewProjectModal] = useState(false);

  const filterOptions = [
    { label: 'All Projects', value: 'ALL', count: mockProjects.length },
    { label: 'Active', value: 'ACTIVE', count: mockProjects.filter(p => p.status === 'ACTIVE').length },
    { label: 'On Track', value: 'ON_TRACK', count: mockProjects.filter(p => p.status === 'ON_TRACK').length },
    { label: 'At Risk', value: 'AT_RISK', count: mockProjects.filter(p => p.status === 'AT_RISK').length },
    { label: 'Planned', value: 'PLANNED', count: mockProjects.filter(p => p.status === 'PLANNED').length },
  ];

  const filteredProjects = mockProjects.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.pinCode.includes(search) ||
      p.region.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Infrastructure Projects"
        subtitle="Master registry of municipal infrastructure development contracts and multi-zone initiatives."
        badge={
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {mockProjects.length} Initiatives Registered
          </span>
        }
        actions={
          <button
            onClick={() => setNewProjectModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Register Project</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <FilterBar
          options={filterOptions}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects by code, PIN, name..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Match Filter"
          description="Try broadening your search query or selecting a different status filter."
          action={
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
              className="px-3.5 py-1.5 bg-slate-100 text-xs font-semibold rounded-lg hover:bg-slate-200"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="bg-white rounded-xl p-5 border border-surface-border shadow-card hover:shadow-card-hover hover:border-teal-500/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {project.code}
                    </span>
                    <h3 className="text-base font-bold text-ink-primary group-hover:text-teal-600 transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  <StatusBadge status={project.status} size="sm" />
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-secondary mt-2 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{project.region} (PIN {project.pinCode})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Due: {project.targetDate}</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-secondary font-medium">Corridor Completion</span>
                    <span className="font-bold text-ink-primary">{project.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.status === 'AT_RISK' ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-ink-secondary">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-ink-muted" />
                    <strong>{project.assignedVendorsCount}</strong> Vendors
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{project.budgetSpent} spent</span>
                  </span>
                </div>
                <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs">
                  Inspect Zones <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.name}
          subtitle={`Project Code: ${selectedProject.code} • Region: ${selectedProject.region}`}
          footer={
            <button
              onClick={() => setSelectedProject(null)}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
            >
              Close Details
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-ink-muted">Master PIN Code</p>
                <p className="font-bold text-sm text-ink-primary">{selectedProject.pinCode}</p>
              </div>
              <div>
                <p className="text-ink-muted">Status</p>
                <StatusBadge status={selectedProject.status} size="sm" />
              </div>
              <div>
                <p className="text-ink-muted">Estimated Budget</p>
                <p className="font-bold text-ink-primary">{selectedProject.budgetEstimated}</p>
              </div>
              <div>
                <p className="text-ink-muted">Disbursed Expenditure</p>
                <p className="font-bold text-ink-primary">{selectedProject.budgetSpent}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-ink-primary mb-2">Operational Zones in Corridor</h4>
              <p className="text-ink-secondary mb-3">
                This project encompasses {selectedProject.totalZones} partitioned work parcels under active municipal supervision.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-ink-secondary">
                <span className="font-semibold text-ink-primary">Note for Demonstration:</span> Specific zone allocations and physical dependencies are mapped in the <strong className="text-teal-700">Work Allocation</strong> and <strong className="text-teal-700">Work Zones</strong> modules.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Register Project Demo Modal */}
      <Modal
        isOpen={newProjectModal}
        onClose={() => setNewProjectModal(false)}
        title="Register New Infrastructure Project"
        subtitle="Simulated administrative project registration workflow"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setNewProjectModal(false)}
              className="px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert('Project registration will connect to backend persistence in Stage 4.');
                setNewProjectModal(false);
              }}
              className="px-4 py-1.5 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800"
            >
              Save Project (Demo)
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-ink-primary mb-1">Project Name</label>
            <input 
              type="text" 
              placeholder="e.g. Whitefield Metro Feeder Utility Trenching"
              className="w-full px-3 py-2 border border-surface-border rounded-lg"
              defaultValue="Koramangala 100ft Optical Fiber Re-cabling"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-ink-primary mb-1">Postal PIN Code</label>
              <input 
                type="text" 
                defaultValue="560034"
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-ink-primary mb-1">Target End Date</label>
              <input 
                type="date" 
                defaultValue="2027-02-28"
                className="w-full px-3 py-2 border border-surface-border rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
