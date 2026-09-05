"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lon: number) => void;
  isLoading?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  isLoading = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });

      // Custom pulsing emerald pin
      const customPinIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -top-6 -left-3 h-7 w-7 rounded-full bg-emerald-400/30 animate-ping"></div>
            <div class="relative -top-6 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-950 shadow-lg shadow-emerald-500/50 text-slate-950 font-bold text-xs">
              🌾
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 5,
          zoomControl: false
        });

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
            maxZoom: 19
          }
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const marker = L.marker([latitude, longitude], {
          icon: customPinIcon,
          draggable: true
        }).addTo(map);

        marker.on("dragend", (e: any) => {
          const latlng = e.target.getLatLng();
          onLocationChange(
            parseFloat(latlng.lat.toFixed(4)),
            parseFloat(latlng.lng.toFixed(4))
          );
        });

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          const formattedLat = parseFloat(lat.toFixed(4));
          const formattedLng = parseFloat(lng.toFixed(4));
          marker.setLatLng([formattedLat, formattedLng]);
          onLocationChange(formattedLat, formattedLng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync external coordinate changes with map marker & pan
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-inner sm:h-56">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Map Overlay Badge */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md border border-slate-700/50 shadow-md">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Click anywhere on map to place pin</span>
      </div>

      {/* Lat/Lon Overlay Badge */}
      <div className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 rounded-md bg-slate-950/85 px-2.5 py-1 text-[11px] font-mono text-emerald-300 backdrop-blur-md border border-slate-700/60 shadow">
        {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
      </div>
    </div>
  );
};

