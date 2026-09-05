"use client";

import React from "react";
import { FlaskConical, Beaker, Layers, Sparkles } from "lucide-react";
import { SoilResponse } from "../types";

interface SoilPropertiesCardProps {
  soil?: SoilResponse | null;
  isLoading?: boolean;
}

export const SoilPropertiesCard: React.FC<SoilPropertiesCardProps> = ({
  soil,
  isLoading
}) => {
  const data = soil?.data;
  const nitrogen = data?.nitrogen_g_per_kg ?? 2.07;
  const ph = data?.phh2o ?? 7.5;
  const soc = data?.soc_g_per_kg ?? 31.9;
  const clay = data?.clay_percent ?? 24.0;
  const sand = data?.sand_percent ?? 27.7;
  const silt = data?.silt_percent ?? 48.3;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            SoilGrids Chemistry &amp; Texture
          </h3>
        </div>
        <span className="rounded-md border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
          0-5cm Topsoil
        </span>
      </div>

      {/* 3 Chemical Nutrients */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {/* Nitrogen */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
          <span className="text-[11px] font-medium text-slate-400">Nitrogen (N)</span>
          <span className="mt-1 font-mono text-base font-bold text-emerald-400">
            {nitrogen.toFixed(2)}{" "}
            <span className="text-[10px] font-normal text-slate-400">g/kg</span>
          </span>
          <span className="mt-0.5 text-[10px] text-slate-500">Available</span>
        </div>

        {/* pH */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
          <span className="text-[11px] font-medium text-slate-400">Soil pH</span>
          <span className="mt-1 font-mono text-base font-bold text-cyan-400">
            {ph.toFixed(1)}
          </span>
          <span className="mt-0.5 text-[10px] text-slate-500">
            {ph > 7.3 ? "Slightly Alkaline" : ph < 6.5 ? "Acidic" : "Neutral"}
          </span>
        </div>

        {/* SOC */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
          <span className="text-[11px] font-medium text-slate-400">Organic (SOC)</span>
          <span className="mt-1 font-mono text-base font-bold text-amber-400">
            {soc.toFixed(1)}{" "}
            <span className="text-[10px] font-normal text-slate-400">g/kg</span>
          </span>
          <span className="mt-0.5 text-[10px] text-slate-500">Carbon stock</span>
        </div>
      </div>

      {/* Texture Distribution */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Soil Texture Breakdown</span>
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            Clay {clay}% | Sand {sand}% | Silt {silt}%
          </span>
        </div>

        {/* Stacked Texture Bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950">
          <div
            title={`Clay: ${clay}%`}
            style={{ width: `${clay}%` }}
            className="bg-amber-600 transition-all duration-500"
          />
          <div
            title={`Sand: ${sand}%`}
            style={{ width: `${sand}%` }}
            className="bg-yellow-400 transition-all duration-500"
          />
          <div
            title={`Silt: ${silt}%`}
            style={{ width: `${silt}%` }}
            className="bg-teal-500 transition-all duration-500"
          />
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-600"></span> Clay ({clay}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-400"></span> Sand ({sand}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal-500"></span> Silt ({silt}%)
          </span>
        </div>
      </div>
    </div>
  );
};

