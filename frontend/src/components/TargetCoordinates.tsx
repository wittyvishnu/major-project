"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  Droplets,
  Ruler,
  AlertCircle
} from "lucide-react";
import { REGIONAL_PRESETS } from "../services/api";
import { PresetLocation } from "../types";

// Dynamically import InteractiveMap to prevent SSR Leaflet window errors
const InteractiveMap = dynamic(
  () => import("./InteractiveMap").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900 text-xs text-slate-400 sm:h-56">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <span>Loading interactive satellite map...</span>
        </div>
      </div>
    )
  }
);

interface TargetCoordinatesProps {
  latitude: number;
  longitude: number;
  area: number;
  soilSalinity: string;
  onLatitudeChange: (lat: number) => void;
  onLongitudeChange: (lon: number) => void;
  onAreaChange: (area: number) => void;
  onSoilSalinityChange: (salinity: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  activeStage?: "geospatial" | "recommendation" | null;
}

export const TargetCoordinates: React.FC<TargetCoordinatesProps> = ({
  latitude,
  longitude,
  area,
  soilSalinity,
  onLatitudeChange,
  onLongitudeChange,
  onAreaChange,
  onSoilSalinityChange,
  onAnalyze,
  isLoading,
  activeStage
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("deccan-plateau");

  const handleSelectPreset = (preset: PresetLocation) => {
    setSelectedPresetId(preset.id);
    onLatitudeChange(preset.latitude);
    onLongitudeChange(preset.longitude);
    onAreaChange(preset.area);
    if (preset.soilSalinityPreset) {
      onSoilSalinityChange(preset.soilSalinityPreset);
    }
  };

  const handleMapLocationChange = (lat: number, lon: number) => {
    setSelectedPresetId("");
    onLatitudeChange(lat);
    onLongitudeChange(lon);
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Target Coordinates</h2>
            <p className="text-xs text-slate-400">
              Enter coordinates or click on the interactive map
            </p>
          </div>
        </div>
      </div>

      {/* Coordinate & Area Input Fields */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Latitude */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            ↕ Latitude (°N)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => {
                setSelectedPresetId("");
                onLatitudeChange(parseFloat(e.target.value) || 0);
              }}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              placeholder="e.g. 17.3850"
            />
          </div>
        </div>

        {/* Longitude */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            ↔ Longitude (°E)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => {
                setSelectedPresetId("");
                onLongitudeChange(parseFloat(e.target.value) || 0);
              }}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              placeholder="e.g. 78.4867"
            />
          </div>
        </div>

        {/* Area */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            📐 Farm Area (Hectares)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={area}
              onChange={(e) => onAreaChange(parseFloat(e.target.value) || 1)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              placeholder="2.5"
            />
          </div>
        </div>
      </div>

      {/* Soil Salinity / Texture Option */}
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <Droplets className="h-3.5 w-3.5 text-cyan-400" />
          <span>Soil Salinity Tolerance Check</span>
        </label>
        <select
          value={soilSalinity}
          onChange={(e) => onSoilSalinityChange(e.target.value)}
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        >
          <option value="Low Salinity (Optimal Cropland)">
            Low Salinity (Optimal Cropland - EC &lt; 2 dS/m)
          </option>
          <option value="Moderate Salinity (Sandy Transition)">
            Moderate Salinity (Sandy Transition - EC 2-4 dS/m)
          </option>
          <option value="High Salinity (Saline Barren Land)">
            High Salinity (Saline Barren Land - EC &gt; 4 dS/m)
          </option>
        </select>
      </div>

      {/* Quick Regional Presets */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Zap className="h-3.5 w-3.5" />
            <span>Quick Regional Presets (India)</span>
          </span>
          <span className="text-[10px] text-slate-500">Tap to load location</span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {REGIONAL_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-emerald-500/60 bg-emerald-950/30 ring-1 ring-emerald-500/40"
                    : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <span
                  className={`text-xs font-medium line-clamp-1 ${
                    isSelected ? "text-emerald-300" : "text-slate-200"
                  }`}
                >
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {preset.latitude}°N, {preset.longitude}°E
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div>
        <InteractiveMap
          latitude={latitude}
          longitude={longitude}
          onLocationChange={handleMapLocationChange}
          isLoading={isLoading}
        />
      </div>

      {/* Primary Action Button: Analyze Land & Recommend Crops */}
      <button
        onClick={onAnalyze}
        disabled={isLoading}
        type="button"
        className={`group relative flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 font-semibold text-slate-950 shadow-lg transition-all duration-200 ${
          isLoading
            ? "cursor-not-allowed bg-emerald-600/70 opacity-80"
            : "bg-emerald-400 hover:bg-emerald-300 hover:shadow-emerald-500/30 active:scale-[0.99] shadow-emerald-500/20"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-950 text-sm font-bold">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            <span>
              {activeStage === "geospatial"
                ? "Checking Sentinel-2 Geospatial Feasibility..."
                : "Predicting Optimal Crops & Yield Models..."}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-950 text-sm font-bold tracking-wide">
            <Sparkles className="h-4 w-4" />
            <span>Analyze Land &amp; Recommend Crops</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        )}
      </button>
    </div>
  );
};

