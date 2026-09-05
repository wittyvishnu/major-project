"use client";

import React from "react";
import { Sprout, Satellite, Activity, Wifi, Sparkles } from "lucide-react";

interface NavbarProps {
  isLiveApi: boolean;
  onToggleApiMode: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLiveApi,
  onToggleApiMode,
  isLoading
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Sprout className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                AgriPulse <span className="text-emerald-400">AI</span>
              </h1>
              <span className="hidden rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider md:inline-block">
                v2.4
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">
              Satellite Geospatial Intelligence & Climate Crop Forecaster
            </p>
          </div>
        </div>

        {/* Telemetry & Mode Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mode Switcher */}
          <button
            onClick={onToggleApiMode}
            type="button"
            className={`group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isLiveApi
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500/70 shadow-sm shadow-emerald-950"
                : "border-amber-500/40 bg-amber-950/40 text-amber-300 hover:border-amber-500/70 shadow-sm shadow-amber-950"
            }`}
            title="Click to toggle between live Flask backend and demo simulation mode"
          >
            <Wifi
              className={`h-3.5 w-3.5 ${
                isLiveApi ? "text-emerald-400 animate-pulse" : "text-amber-400"
              }`}
            />
            <span>
              {isLiveApi ? "API: Live (port 5000)" : "API: Demo / Simulation"}
            </span>
          </button>

          {/* Satellite Status Pill */}
          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 md:flex">
            <Satellite className="h-3.5 w-3.5 text-emerald-400" />
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Sentinel-2 & Geospatial</span>
          </div>

          {/* Dynamic Analysis Activity indicator */}
          {isLoading && (
            <div className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-950/50 px-2.5 py-1.5 text-xs text-teal-300 animate-pulse">
              <Activity className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

