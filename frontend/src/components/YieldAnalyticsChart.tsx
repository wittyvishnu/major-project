"use client";

import React from "react";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { CropRecommendation } from "../types";
import { formatCropName } from "../services/api";

interface YieldAnalyticsChartProps {
  recommendations: CropRecommendation[];
}

export const YieldAnalyticsChart: React.FC<YieldAnalyticsChartProps> = ({
  recommendations
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  // Max combined production for scaling the bars
  const maxProd = Math.max(
    ...recommendations.map(
      (r) => r["combined_production(t)"] ?? r.combined_production ?? 10
    ),
    10
  );

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">
            Yield &amp; Production Intercrop Comparison
          </h3>
        </div>
        <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300">
          Metric Tons (t)
        </span>
      </div>

      {/* Visual Comparative Bars */}
      <div className="mt-4 space-y-4">
        {recommendations.map((rec, i) => {
          const mainProd =
            rec["main_crop_production(t)"] ?? rec.main_crop_production ?? 0;
          const intermProd =
            rec["interm_crop_production(t)"] ?? rec.interm_crop_production ?? 0;
          const combinedProd =
            rec["combined_production(t)"] ?? rec.combined_production ?? 0;
          const yieldInc =
            rec["yield_increase(%)"] ?? rec.yield_increase ?? 0;

          const mainWidthPercent = (mainProd / maxProd) * 100;
          const intermWidthPercent = (intermProd / maxProd) * 100;

          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  {formatCropName(rec.main_crop)} +{" "}
                  <span className="text-emerald-400">
                    {formatCropName(rec.interm_crop)}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-xs">
                    +{yieldInc.toFixed(1)}% yield
                  </span>
                  <span className="font-mono text-slate-200 font-bold text-xs">
                    {combinedProd.toFixed(2)} t total
                  </span>
                </div>
              </div>

              {/* Multi-segment stacked bar */}
              <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                {/* Main crop portion */}
                <div
                  style={{ width: `${mainWidthPercent}%` }}
                  className="bg-teal-600 transition-all duration-700"
                  title={`Main Crop (${rec.main_crop}): ${mainProd.toFixed(2)} t`}
                />
                {/* Intercrop portion */}
                <div
                  style={{ width: `${intermWidthPercent}%` }}
                  className="bg-emerald-400 transition-all duration-700"
                  title={`Intercrop (${rec.interm_crop}): ${intermProd.toFixed(2)} t`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>
                  Solo: {mainProd.toFixed(2)} t ({rec.main_crop})
                </span>
                <span>
                  Intercrop gain: +{intermProd.toFixed(2)} t ({rec.interm_crop})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 border-t border-slate-800/70 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-600"></span>
          <span>Main Crop Base Production</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
          <span>Intercropped Added Production</span>
        </div>
      </div>
    </div>
  );
};

