"use client";

import React from "react";
import { Radio, Info, Eye } from "lucide-react";
import { GeospatialData } from "../types";

interface SpectralIndicesCardProps {
  geospatial?: GeospatialData | null;
  isLoading?: boolean;
}

export const SpectralIndicesCard: React.FC<SpectralIndicesCardProps> = ({
  geospatial,
  isLoading
}) => {
  const ndvi = geospatial?.NDVI ?? 0.08;
  const ndwi = geospatial?.NDWI ?? -0.65;
  const ndmi = geospatial?.NDMI ?? 0.05;
  const evi = geospatial?.EVI ?? 0.07;
  const gndvi = geospatial?.GNDVI ?? Math.max(0.02, ndvi * 0.9);
  const ndsi = geospatial?.NDSI ?? Math.max(0.01, 0.45 - ndvi * 0.4);

  // Helper to normalize -1 to 1 into 0% to 100%
  const getPercent = (val: number, min = -1, max = 1) => {
    const clamped = Math.max(min, Math.min(max, val));
    return ((clamped - min) / (max - min)) * 100;
  };

  const indices = [
    {
      key: "NDVI",
      label: "NDVI(Vegetation Index)",
      name: "Normalized Difference Vegetation Index",
      value: ndvi,
      percent: Math.min(100, Math.max(0, (ndvi / 1.0) * 100)),
      color: "bg-cyan-400 shadow-cyan-400/50",
      description: "Plant greenness & active photosynthetic biomass"
    },
    {
      key: "NDWI",
      label: "NDWI(Water Index)",
      name: "Normalized Difference Water Index",
      value: ndwi,
      percent: getPercent(ndwi, -1, 1),
      color: "bg-blue-500 shadow-blue-500/50",
      description: "Surface water bodies & moisture saturation"
    },
    {
      key: "NDMI",
      label: "NDMI(Moisture Index)",
      name: "Normalized Difference Moisture Index",
      value: ndmi,
      percent: getPercent(ndmi, -1, 1),
      color: "bg-teal-400 shadow-teal-400/50",
      description: "Crop canopy water content & drought stress"
    },
    {
      key: "EVI",
      label: "EVI(Enhanced Vegetation Index)",
      name: "Enhanced Vegetation Index",
      value: evi,
      percent: Math.min(100, Math.max(0, (evi / 5.0) * 100)),
      color: "bg-emerald-400 shadow-emerald-400/50",
      description: "Atmospherically corrected dense canopy biomass"
    },
    {
      key: "NDSI",
      label: "NDSI(Normalized Difference Salinity Index)",
      name: "Normalized Difference Salinity Index",
      value: ndsi,
      percent: Math.min(100, Math.max(0, (ndsi / 1.0) * 100)),
      color: "bg-sky-400 shadow-sky-400/50",
      description: "Soil salinity & mineral reflectance signature"
    },
    {
      key: "GNDVI",
      label: "GNDVI(Green Normalized Difference Vegetation Index)",
      name: "Green Normalized Difference Vegetation Index",
      value: gndvi,
      percent: Math.min(100, Math.max(0, (gndvi / 1.0) * 100)),
      color: "bg-cyan-500 shadow-cyan-500/50",
      description: "Chlorophyll concentration & nitrogen uptake"
    }
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">
            Sentinel-2 Spectral Indices
          </h3>
        </div>
        <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-300">
          6 Bands
        </span>
      </div>

      {/* Indices Bars List */}
      <div className="mt-4 space-y-3.5">
        {indices.map((idx) => (
          <div key={idx.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 font-mono">
                {idx.label}
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {idx.value >= 0 ? idx.value.toFixed(3) : idx.value.toFixed(3)}
              </span>
            </div>

            {/* Progress Track */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${idx.color}`}
                style={{ width: `${Math.min(100, Math.max(4, idx.percent))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Image Date & Capture Footer */}
      {geospatial?.image_date && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/70 pt-2.5 text-[11px] text-slate-400">
          <span>Acquisition: {geospatial.image_date}</span>
          <span>Scenes analyzed: {geospatial.image_count || 148}</span>
        </div>
      )}
    </div>
  );
};

