import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, MapPin, Layers, RotateCcw } from 'lucide-react';

export interface MapZoneData {
  id: string;
  code: string;
  name: string;
  pinCode: string;
  locality?: string;
  district?: string;
  state?: string;
  region?: string;
  projectId?: string;
  projectName?: string;
  status: string;
  currentWorkType?: string;
  assignedVendorName?: string;
  activeWork?: number;
  totalAssignments?: number;
  blockedWork?: number;
  completedWork?: number;
  dependencyStatus?: string;
  blockingReason?: string;
  lat: number;
  lng: number;
  isApproximate?: boolean;
}

export interface WorkZoneMapProps {
  zones: MapZoneData[];
  selectedZoneId?: string;
  onSelectZone?: (zone: MapZoneData) => void;
  onResetFilters?: () => void;
  height?: string;
}

const escapeHtml = (unsafe?: string | number | null): string => {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getMarkerColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return '#0D9488'; // InfraPulse Teal
    case 'COMPLETED':
      return '#10B981'; // Emerald Green
    case 'BLOCKED':
      return '#EF4444'; // Rose Red
    case 'AVAILABLE':
      return '#0284C7'; // Sky / Cyan
    case 'INACTIVE':
    default:
      return '#64748B'; // Slate Grey
  }
};

const createMarkerIcon = (isSelected: boolean, color: string): L.DivIcon => {
  const size = isSelected ? 34 : 26;
  const pulseHtml = isSelected
    ? `<span style="position: absolute; inset: -6px; border-radius: 50%; border: 2.5px solid ${color}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  return L.divIcon({
    className: 'infrapulse-zone-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        ${pulseHtml}
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: ${isSelected ? '3px solid #FFFFFF' : '2px solid #FFFFFF'};
          border-radius: 50%;
          box-shadow: ${
            isSelected
              ? `0 0 0 3px ${color}, 0 6px 14px rgba(0,0,0,0.35)`
              : '0 3px 8px rgba(0,0,0,0.25)'
          };
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
        ">
          <div style="
            width: ${isSelected ? '10px' : '8px'};
            height: ${isSelected ? '10px' : '8px'};
            background-color: #FFFFFF;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

const createPopupElement = (zone: MapZoneData, color: string): HTMLElement => {
  const div = document.createElement('div');
  div.className = 'infrapulse-popup-content text-xs font-sans';
  div.style.minWidth = '230px';
  div.style.maxWidth = '290px';

  div.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0;">
      <div>
        <span style="
          display: inline-block;
          font-family: ui-monospace, monospace;
          font-weight: 700;
          font-size: 11px;
          color: #0F766E;
          background: #F0FDFA;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #CCFBF1;
        ">${escapeHtml(zone.code)}</span>
        <h4 style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.3;">
          ${escapeHtml(zone.name)}
        </h4>
      </div>
      <span style="
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 9999px;
        background: ${color}15;
        color: ${color};
        border: 1px solid ${color}40;
        white-space: nowrap;
      ">${escapeHtml(zone.status)}</span>
    </div>

    <div style="font-size: 11px; color: #475569; margin-bottom: 8px; line-height: 1.5;">
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="color: #64748B;">📍 Locality:</span>
        <strong style="color: #1E293B;">${escapeHtml(zone.locality || zone.region || 'General Sector')}</strong>
      </div>
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="color: #64748B;">📮 Postal PIN:</span>
        <strong style="color: #1E293B; font-family: ui-monospace, monospace;">${escapeHtml(zone.pinCode)}</strong>
        ${zone.district ? `<span style="color: #94A3B8;">(${escapeHtml(zone.district)})</span>` : ''}
      </div>
    </div>

    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px; font-size: 11px; margin-bottom: 8px;">
      <div style="color: #64748B; font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Associated Project</div>
      <div style="color: #0284C7; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${escapeHtml(zone.projectName || 'Infrastructure Works')}
      </div>
      <div style="margin-top: 4px; display: flex; justify-content: space-between; align-items: center; gap: 6px;">
        <span style="color: #64748B; white-space: nowrap;">Assigned Vendor:</span>
        <strong style="color: #1E293B; text-align: right; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(zone.assignedVendorName || 'Pending Allocation')}
        </strong>
      </div>
      ${
        zone.currentWorkType
          ? `<div style="margin-top: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
              <span style="color: #64748B;">Work Type:</span>
              <span style="color: #334155; font-weight: 600;">${escapeHtml(zone.currentWorkType)}</span>
            </div>`
          : ''
      }
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-top: 4px; border-top: 1px solid #E2E8F0;">
      <span style="color: #64748B;">Assigned Tasks:</span>
      <span style="font-weight: 700; color: #0F766E;">
        ${
          typeof zone.activeWork === 'number'
            ? `${zone.activeWork} active`
            : typeof zone.totalAssignments === 'number'
            ? `${zone.totalAssignments} tasks`
            : '0 active'
        }
      </span>
    </div>

    ${
      zone.blockingReason
        ? `<div style="margin-top: 6px; font-size: 10px; color: #DC2626; background: #FEF2F2; padding: 4px 6px; border-radius: 4px; border: 1px solid #FEE2E2;">
            ⚠️ ${escapeHtml(zone.blockingReason)}
          </div>`
        : ''
    }

    <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #CBD5E1; font-size: 10px; color: #94A3B8; font-family: ui-monospace, monospace; display: flex; justify-content: space-between;">
      <span>GPS: ${zone.lat.toFixed(4)}°, ${zone.lng.toFixed(4)}°</span>
      <span style="color: ${zone.isApproximate ? '#D97706' : '#0D9488'}; font-weight: 600;">
        ${zone.isApproximate ? 'Approximate Centroid' : 'GPS Verified (WGS 84)'}
      </span>
    </div>
  `;
  return div;
};

export const WorkZoneMap: React.FC<WorkZoneMapProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  onResetFilters,
  height = '450px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const markersMapRef = useRef<{ [key: string]: L.Marker }>({});
  const lastZoneIdsRef = useRef<string>('');

  // Filter only zones that have valid numerical coordinates
  const validZones = useMemo(() => {
    return zones.filter(
      (z) =>
        typeof z.lat === 'number' &&
        typeof z.lng === 'number' &&
        !isNaN(z.lat) &&
        !isNaN(z.lng) &&
        z.lat >= -90 &&
        z.lat <= 90 &&
        z.lng >= -180 &&
        z.lng <= 180
    );
  }, [zones]);

  // Initial Map Construction (Runs ONCE on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      return;
    }

    // Default center around Chennai corridor
    const defaultCenter: [number, number] = [13.0827, 80.2707];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true,
      fadeAnimation: false, // Prevents tile flickering/fade delays
    });

    // Standard OpenStreetMap Tile Source with buffer preservation
    const osmTileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        minZoom: 3,
        keepBuffer: 6, // Keeps off-screen tiles in memory so panning does not show grey gaps
        updateWhenIdle: true, // Loads new tiles only after panning/zooming stabilizes
        updateWhenZooming: false, // Prevents excessive tile churn during zoom animations
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }
    );

    osmTileLayer.on('tileerror', (e) => {
      console.warn('OpenStreetMap tile request notice:', e);
    });

    osmTileLayer.addTo(map);

    // Create a dedicated feature group for markers to avoid touching tile layers
    const markersLayer = L.featureGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Trigger initial layout calculation cleanly
    const initTimer = setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 120);

    return () => {
      clearTimeout(initTimer);
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      markersMapRef.current = {};
    };
  }, []);

  // Update Markers when validZones list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Check if the actual set of zone IDs changed to avoid redundant bounds jumps
    const currentZoneIds = validZones.map((z) => z.id).sort().join(',');
    const zonesListChanged = lastZoneIdsRef.current !== currentZoneIds;

    // Clear previous markers from group
    markersLayer.clearLayers();
    markersMapRef.current = {};

    if (validZones.length === 0) {
      lastZoneIdsRef.current = '';
      return;
    }

    const latLngs: L.LatLngExpression[] = [];

    validZones.forEach((zone) => {
      const isSelected = zone.id === selectedZoneId;
      const color = getMarkerColor(zone.status);
      latLngs.push([zone.lat, zone.lng]);

      const icon = createMarkerIcon(isSelected, color);
      const marker = L.marker([zone.lat, zone.lng], {
        icon,
        title: `${zone.name} (${zone.code})`,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      const popupEl = createPopupElement(zone, color);
      marker.bindPopup(popupEl, {
        maxWidth: 320,
        className: 'infrapulse-map-popup',
        autoPan: false, // Prevents map bounds jerking when popup opens
      });

      marker.on('click', () => {
        if (onSelectZone) {
          onSelectZone(zone);
        }
      });

      marker.addTo(markersLayer);
      markersMapRef.current[zone.id] = marker;
    });

    // Auto-fit bounds ONLY when the set of zones has changed (e.g. search/filter applied)
    if (zonesListChanged) {
      lastZoneIdsRef.current = currentZoneIds;
      if (latLngs.length > 1) {
        try {
          const bounds = L.latLngBounds(latLngs);
          map.fitBounds(bounds, {
            padding: [48, 48],
            maxZoom: 14,
            animate: false, // Instant fit to avoid tile churn
          });
        } catch (err) {
          console.warn('Error auto-fitting map bounds:', err);
        }
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 14, { animate: false });
      }
    }
  }, [validZones, onSelectZone]);

  // Handle selectedZoneId change (smooth pan and open popup without recreating markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedZoneId) return;

    const marker = markersMapRef.current[selectedZoneId];
    const selected = validZones.find((z) => z.id === selectedZoneId);

    // Update marker styling (scale & zIndex) for all without re-adding layers
    validZones.forEach((zone) => {
      const m = markersMapRef.current[zone.id];
      if (m) {
        const isSel = zone.id === selectedZoneId;
        const color = getMarkerColor(zone.status);
        m.setIcon(createMarkerIcon(isSel, color));
        m.setZIndexOffset(isSel ? 1000 : 0);
      }
    });

    if (marker && selected) {
      // Pan smoothly to selected location and open popup
      map.panTo([selected.lat, selected.lng], { animate: true });
      marker.openPopup();
    }
  }, [selectedZoneId, validZones]);

  // Debounced Container Resize Handling
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    let resizeTimer: any = null;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: true });
            }
          }, 120);
        }
      }
    });

    observer.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [height]);

  const handleResetView = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || validZones.length === 0) return;

    if (validZones.length > 1) {
      const latLngs = validZones.map((z) => [z.lat, z.lng] as [number, number]);
      map.fitBounds(L.latLngBounds(latLngs), {
        padding: [48, 48],
        maxZoom: 14,
        animate: true,
      });
    } else if (validZones.length === 1) {
      map.setView([validZones[0].lat, validZones[0].lng], 14, { animate: true });
    }
  }, [validZones]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-surface-border bg-slate-100 shadow-card">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="z-0"
      />

      {/* Map Header Controls Overlay */}
      <div className="absolute top-3 left-14 z-[400] flex items-center gap-2 pointer-events-auto">
        {validZones.length > 0 && (
          <button
            type="button"
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 text-[11px] font-semibold rounded-lg border border-slate-200 shadow-sm backdrop-blur transition-colors"
            title="Fit map bounds to all currently displayed work zones"
          >
            <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Fit All Zones ({validZones.length})</span>
          </button>
        )}
      </div>

      {/* Map Status Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-surface-border shadow-dropdown text-xs flex flex-col gap-1.5 pointer-events-auto">
        <div className="font-semibold text-ink-primary flex items-center justify-between gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Spatial Work Zones</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-teal-700 font-mono font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            OpenStreetMap
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Blocked
          </span>
        </div>
      </div>

      {/* Empty State Overlay if no valid coordinates match */}
      {validZones.length === 0 && (
        <div className="absolute inset-0 z-[400] bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white/95 border border-slate-200 rounded-xl p-5 shadow-lg max-w-sm text-center pointer-events-auto">
            <MapPin className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-800">No Matching Work Zones</h4>
            <p className="text-[11px] text-slate-500 mt-1 mb-3">
              No registered work zones match the current search or filter criteria.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
