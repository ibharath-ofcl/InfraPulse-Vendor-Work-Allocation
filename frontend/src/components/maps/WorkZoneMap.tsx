import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WorkZone } from '../../types';

interface WorkZoneMapProps {
  zones: WorkZone[];
  selectedZoneId?: string;
  onSelectZone?: (zone: WorkZone) => void;
  height?: string;
}

export const WorkZoneMap: React.FC<WorkZoneMapProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered around Bangalore infrastructure test zone
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.6101],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Positron clean light basemap
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

    // Custom marker icon generator based on zone status
    const getMarkerColor = (status: string) => {
      switch (status) {
        case 'ACTIVE':
        case 'COMPLETED':
          return '#16A34A'; // Success green
        case 'IN_PROGRESS':
          return '#2563EB'; // Blue
        case 'BLOCKED':
          return '#DC2626'; // Danger red
        case 'AVAILABLE':
        default:
          return '#64748B'; // Slate
      }
    };

    zones.forEach((zone) => {
      const color = getMarkerColor(zone.status);
      const isSelected = zone.id === selectedZoneId;

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

      // Popup card
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-xs font-sans text-slate-800';
      popupContent.innerHTML = `
        <div style="font-weight: 700; font-size: 13px; color: #172033; margin-bottom: 2px;">
          ${zone.name}
        </div>
        <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">
          PIN: <strong>${zone.pinCode}</strong> • ${zone.code}
        </div>
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
          <span style="font-size: 11px; color: #475569;">
            ${zone.currentWorkType}
          </span>
        </div>
        ${zone.assignedVendorName ? `
          <div style="font-size: 11px; color: #334155; border-top: 1px solid #E2E8F0; padding-top: 4px;">
            Vendor: <strong>${zone.assignedVendorName}</strong>
          </div>
        ` : ''}
        ${zone.blockingReason ? `
          <div style="font-size: 10px; color: #DC2626; background: #FEF2F2; padding: 4px; border-radius: 4px; margin-top: 4px;">
            ⚠️ ${zone.blockingReason}
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

    // If selected zone, pan to it
    if (selectedZoneId && markersRef.current[selectedZoneId]) {
      const selected = zones.find((z) => z.id === selectedZoneId);
      if (selected) {
        map.setView([selected.lat, selected.lng], 14, { animate: true });
        markersRef.current[selectedZoneId].openPopup();
      }
    }
  }, [zones, selectedZoneId, onSelectZone]);

  // Clean resize observer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [height]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-surface-border bg-slate-50 shadow-card">
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }} 
        className="z-0"
      />

      {/* Map Legend & Disclaimer Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-surface-border shadow-dropdown text-xs flex flex-col gap-1.5">
        <div className="font-semibold text-ink-primary flex items-center justify-between gap-3 text-[11px]">
          <span>GIS Spatial Zones</span>
          <span className="text-[10px] text-ink-muted font-normal">(Illustrative GIS)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Blocked
          </span>
        </div>
      </div>
    </div>
  );
};
