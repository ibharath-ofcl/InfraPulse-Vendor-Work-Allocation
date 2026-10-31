import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapZoneData {
  id: string;
  code: string;
  name: string;
  pinCode: string;
  projectName?: string;
  status: string;
  currentWorkType?: string;
  assignedVendorName?: string;
  activeWork?: number;
  blockedWork?: number;
  completedWork?: number;
  lat: number;
  lng: number;
}

interface WorkZoneMapProps {
  zones: MapZoneData[];
  selectedZoneId?: string;
  onSelectZone?: (zone: MapZoneData) => void;
  height?: string;
}

export const WorkZoneMap: React.FC<WorkZoneMapProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  height = '400px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Filter only zones that have valid coordinates
  const validZones = zones.filter(
    (z) => typeof z.lat === 'number' && typeof z.lng === 'number' && !isNaN(z.lat) && !isNaN(z.lng)
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = validZones.length > 0
        ? [validZones[0].lat, validZones[0].lng]
        : [13.0827, 80.2707]; // Chennai default

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const getMarkerColor = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return '#0D9488'; // Teal
        case 'COMPLETED':
          return '#16A34A'; // Green
        case 'IN_PROGRESS':
          return '#2563EB'; // Blue
        case 'BLOCKED':
          return '#DC2626'; // Red
        case 'AVAILABLE':
        default:
          return '#64748B'; // Slate
      }
    };

    const latLngs: L.LatLngExpression[] = [];

    validZones.forEach((zone) => {
      const color = getMarkerColor(zone.status);
      const isSelected = zone.id === selectedZoneId;
      latLngs.push([zone.lat, zone.lng]);

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
            <span style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
              display: inline-block;
            "></span>
          </div>
        `,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: customIcon }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-xs font-sans text-slate-800';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #172033; margin-bottom: 2px;">
          ${zone.name}
        </div>
        <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">
          PIN: <strong>${zone.pinCode}</strong> • ${zone.code}
        </div>
        ${zone.projectName ? `
          <div style="font-size: 11px; color: #2563EB; font-weight: 600; margin-bottom: 4px;">
            ${zone.projectName}
          </div>
        ` : ''}
        <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 6px;">
          <span style="
            display: inline-block;
            padding: 2px 6px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 600;
            background-color: ${color}20;
            color: ${color};
          ">
            ${zone.status}
          </span>
          ${zone.currentWorkType ? `<span style="font-size: 11px; color: #475569;">${zone.currentWorkType}</span>` : ''}
        </div>
        ${typeof zone.activeWork === 'number' ? `
          <div style="font-size: 10px; color: #334155; border-top: 1px solid #E2E8F0; padding-top: 4px; display: flex; justify-content: space-between;">
            <span>Active Work: <strong>${zone.activeWork}</strong></span>
            <span>Completed: <strong>${zone.completedWork ?? 0}</strong></span>
          </div>
        ` : ''}
        ${zone.assignedVendorName ? `
          <div style="font-size: 11px; color: #334155; padding-top: 2px;">
            Vendor: <strong>${zone.assignedVendorName}</strong>
          </div>
        ` : ''}
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectZone) {
          onSelectZone(zone);
        }
      });

      markersRef.current[zone.id] = marker;
    });

    // Auto-fit bounds if markers exist
    if (latLngs.length > 0) {
      try {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        console.error('Failed to fit bounds', err);
      }
    }

    if (selectedZoneId && markersRef.current[selectedZoneId]) {
      const selected = validZones.find((z) => z.id === selectedZoneId);
      if (selected) {
        map.setView([selected.lat, selected.lng], 14, { animate: true });
        markersRef.current[selectedZoneId].openPopup();
      }
    }
  }, [zones, selectedZoneId, onSelectZone]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [height]);

  if (validZones.length === 0) {
    return (
      <div 
        style={{ height }}
        className="rounded-xl overflow-hidden border border-surface-border bg-slate-50 shadow-card flex flex-col items-center justify-center p-6 text-center"
      >
        <p className="font-semibold text-sm text-ink-primary">No Spatial Work Zones Available</p>
        <p className="text-xs text-ink-secondary mt-1 max-w-sm">
          No active work zones with registered geographical coordinates are associated with this scope.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-surface-border bg-slate-50 shadow-card">
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }} 
        className="z-0"
      />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-surface-border shadow-dropdown text-xs flex flex-col gap-1.5">
        <div className="font-semibold text-ink-primary flex items-center justify-between gap-3 text-[11px]">
          <span>Operational GIS Deployment</span>
          <span className="text-[10px] text-teal-600 font-mono font-bold">PostgreSQL GIS</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Blocked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Available
          </span>
        </div>
      </div>
    </div>
  );
};
