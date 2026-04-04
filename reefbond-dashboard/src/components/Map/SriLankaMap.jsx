import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { REEF_SITES } from '../../data/reefSites';
import { getRiskColor } from '../../utils/helpers';

export default function SriLankaMap({ selectedSite, onSelectSite, stats }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Initialize map once
  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [7.5, 80.7],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 15,
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers when stats/selection changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    REEF_SITES.forEach((site) => {
      const regionKey = site.region === 'southern' ? 'Southern Sri Lanka' : 'Eastern Sri Lanka';
      const risk = stats?.regions?.[regionKey]?.bleaching_risk_percent || 50;
      const color = getRiskColor(risk);
      const isSelected = selectedSite === site.name;

      // Pulsing circle for selected
      if (isSelected) {
        const pulse = L.circleMarker([site.lat, site.lng], {
          radius: 20, color: color, fillColor: color, fillOpacity: 0.15,
          weight: 1, className: 'pulse-marker',
        }).addTo(mapInstance.current);
        markersRef.current.push(pulse);
      }

      // Main marker
      const marker = L.circleMarker([site.lat, site.lng], {
        radius: isSelected ? 10 : 6,
        color: isSelected ? '#fff' : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.7,
        weight: isSelected ? 2 : 1,
      }).addTo(mapInstance.current);

      // Tooltip
      const tooltipContent = `
        <div style="font-family:'DM Sans',sans-serif;font-size:11px;min-width:120px">
          <div style="color:${color};font-weight:700;font-size:12px">${site.name}</div>
          <div style="color:#94a3b8;font-size:9px;margin-top:2px">${site.description}</div>
          <div style="color:${color};font-weight:800;margin-top:4px;font-size:11px">
            Risk: ${risk.toFixed(1)}%
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: isSelected,
        direction: 'top',
        offset: [0, -10],
        className: 'reef-tooltip-custom',
      });

      marker.on('click', () => onSelectSite(site.name));

      markersRef.current.push(marker);
    });
  }, [selectedSite, stats, ]);

  // Fly to selected site
  useEffect(() => {
    if (!mapInstance.current) return;
    const site = REEF_SITES.find(s => s.name === selectedSite);
    if (site) {
      mapInstance.current.flyTo([site.lat, site.lng], 9, { duration: 1 });
    }
  }, [selectedSite]);

  return (
    <div>
      <div ref={mapRef} style={{ height: 360, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }} />

      <style>{`
        .reef-tooltip-custom {
          background: #1e293b !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
          padding: 8px 10px !important;
        }
        .reef-tooltip-custom::before {
          border-top-color: #1e293b !important;
        }
        .leaflet-container {
          background: #0d1525 !important;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        .pulse-marker {
        animation: pulse-ring 2s infinite;
        transform-box: fill-box;
        transform-origin: center;
}
      `}</style>
    </div>
  );
}