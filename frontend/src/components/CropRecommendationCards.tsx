"use client";

import React from "react";
import {
  Sprout,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Calendar,
  Percent,
  Compass
} from "lucide-react";
import { CropRecommendation } from "../types";
import { formatCropName } from "../services/api";

interface CropRecommendationCardsProps {
  recommendations: CropRecommendation[];
  areaHectares: number;
  isLoading?: boolean;
}

const CROP_METADATA: Record<
  string,
  { season: string; desc: string; optimalTemp: string; optimalHumidity: string }
> = {
  mothbeans: {
    season: "Summer / Monsoon (Jun–Oct)",
    desc: "Drought-hardy pulse crop, fixes atmospheric nitrogen and prevents soil erosion.",
    optimalTemp: "24°C – 32°C",
    optimalHumidity: "40% – 60%"
  },
  millet: {
    season: "Monsoon / Kharif (Jul–Nov)",
    desc: "Climate-resilient cereal grain with low water demand and high dietary fiber.",
    optimalTemp: "20°C – 30°C",
    optimalHumidity: "45% – 65%"
  },
  muskmelon: {
    season: "Spring / Summer (Feb–Jun)",
    desc: "High-value cucurbit fruit crop thriving in well-drained sandy loam soil.",
    optimalTemp: "22°C – 34°C",
    optimalHumidity: "50% – 70%"
  },
  blackgram: {
    season: "Kharif / Zaid (Jul–Oct)",
    desc: "Short-duration protein-rich legume enhancing subsequent crop yields.",
    optimalTemp: "25°C – 35°C",
    optimalHumidity: "60% – 75%"
  },
  sesame: {
    season: "Late Summer / Autumn (Jul–Nov)",
    desc: "Deep-rooted oilseed crop with exceptional drought tolerance.",
    optimalTemp: "25°C – 35°C",
    optimalHumidity: "40% – 60%"
  },
  wheat: {
    season: "Winter / Spring (Nov–Apr)",
    desc: "Cereal grain staple food crop. Highly productive in cool fertile soil.",
    optimalTemp: "10°C – 20°C",
    optimalHumidity: "50% – 70%"
  },
  rice: {
    season: "Summer (May–Sep)",
    desc: "Paddy crop requiring abundant irrigation, humid climate, and fine texture soils.",
    optimalTemp: "20°C – 30°C",
    optimalHumidity: "70% – 90%"
  },
  maize: {
    season: "Spring / Summer (Mar–Aug)",
    desc: "Warm-season versatile cereal crop with moderate water demand.",
    optimalTemp: "18°C – 27°C",
    optimalHumidity: "60% – 80%"
  },
  chickpea: {
    season: "Winter (Oct–Mar)",
    desc: "Deep-rooting legume that fixes soil nitrogen with superior drought tolerance.",
    optimalTemp: "15°C – 25°C",
    optimalHumidity: "40% – 60%"
  },
  sugarcane: {
    season: "Perennial / Year-round",
    desc: "High biomass perennial grass requiring warm climate and steady moisture.",
    optimalTemp: "21°C – 35°C",
    optimalHumidity: "60% – 80%"
  }
};

export const CropRecommendationCards: React.FC<CropRecommendationCardsProps> = ({
  recommendations,
  areaHectares,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex animate-pulse flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <div className="h-6 w-24 rounded bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-20 w-full rounded bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <Sprout className="mb-2 h-8 w-8 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-300">
          No Crop Recommendations Generated Yet
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Trigger geospatial land analysis to predict top crop suitability combinations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Crop Suitability Ranking</h2>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Top {recommendations.length} Recommended Combinations
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {recommendations.map((rec, index) => {
          const mainCrop = rec.main_crop.toLowerCase();
          const intermCrop = rec.interm_crop.toLowerCase();
          const meta = CROP_METADATA[mainCrop] || {
            season: "Seasonal (Optimal Window)",
            desc: "Well suited for current agro-climatic and soil parameters.",
            optimalTemp: "20°C – 30°C",
            optimalHumidity: "50% – 70%"
          };

          const rankBadgeColor =
            index === 0
              ? "border-emerald-500/50 bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30"
              : index === 1
              ? "border-teal-500/40 bg-teal-950/70 text-teal-300"
              : "border-slate-700 bg-slate-800/80 text-slate-300";

          const yieldIncrease =
            rec["yield_increase(%)"] ?? rec.yield_increase ?? 0;
          const prob =
            rec["crop_probability(%)"] ?? rec.crop_probability ?? 0;
          const combinedProd =
            rec["combined_production(t)"] ?? rec.combined_production ?? 0;
          const mainYield =
            rec["main_crop_yield(t/ha)"] ?? rec.main_crop_yield ?? 0;
          const mainProd =
            rec["main_crop_production(t)"] ?? rec.main_crop_production ?? 0;
          const intermYield =
            rec["interm_crop_yield(t/ha)"] ?? rec.interm_crop_yield ?? 0;
          const intermProd =
            rec["interm_crop_production(t)"] ?? rec.interm_crop_production ?? 0;
          const intermArea =
            rec["intercrop_area(hectares)"] ?? rec.intercrop_area ?? 0;
          const sustainability =
            rec["land_sustainability(%)"] ?? rec.land_sustainability ?? 0;
          const score = rec.recommendation_score ?? 0;

          return (
            <div
              key={index}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.01] ${
                index === 0
                  ? "border-emerald-500/40 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-emerald-950/20 shadow-emerald-950/30 ring-1 ring-emerald-500/20"
                  : "border-slate-800 bg-slate-900/80 shadow-slate-950/40"
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white capitalize">
                      {formatCropName(rec.main_crop)}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{meta.season}</span>
                    </div>
                  </div>

                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${rankBadgeColor}`}
                  >
                    RANK #{index + 1}
                  </span>
                </div>

                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                  {meta.desc}
                </p>

                {/* Primary Metric Highlights */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400">
                      Yield Boost
                    </span>
                    <span className="font-mono text-sm font-extrabold text-emerald-400">
                      +{yieldIncrease.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400">
                      Combined Yield
                    </span>
                    <span className="font-mono text-sm font-extrabold text-cyan-300">
                      {combinedProd.toFixed(2)} tons
                    </span>
                  </div>
                </div>

                {/* Intercropping Partner Details */}
                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Intercrop: {formatCropName(rec.interm_crop)}</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      {intermArea.toFixed(2)} ha
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
                    <span>Intercrop Yield:</span>
                    <span className="font-mono font-bold text-white">
                      {intermYield.toFixed(2)} t/ha ({intermProd.toFixed(2)} t)
                    </span>
                  </div>
                </div>

                {/* Detailed Parameters List */}
                <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Main Crop Yield:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {mainYield.toFixed(2)} t/ha ({mainProd.toFixed(2)} t)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crop Probability:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {prob.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Land Sustainability:</span>
                    <span className="font-mono font-medium text-emerald-300">
                      +{sustainability}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommendation Score:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suitability Progress Meter */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Suitability Match</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.min(99, Math.round(score * 2.2 + 20))}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{
                      width: `${Math.min(100, Math.round(score * 2.2 + 20))}%`
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

