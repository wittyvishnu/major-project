"use client";

import React, { useState, useMemo } from "react";
import {
  Table as TableIcon,
  Download,
  ArrowUpDown,
  Search,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles
} from "lucide-react";
import { CropRecommendation } from "../types";
import { formatCropName } from "../services/api";

interface CropComparisonTableProps {
  recommendations: CropRecommendation[];
  areaHectares: number;
}

type SortKey =
  | "recommendation_score"
  | "yield_increase"
  | "combined_production"
  | "main_crop_yield"
  | "land_sustainability";

export const CropComparisonTable: React.FC<CropComparisonTableProps> = ({
  recommendations,
  areaHectares
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recommendation_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    return recommendations
      .filter((rec) => {
        const query = searchTerm.toLowerCase();
        return (
          rec.main_crop.toLowerCase().includes(query) ||
          rec.interm_crop.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        switch (sortBy) {
          case "recommendation_score":
            valA = a.recommendation_score ?? 0;
            valB = b.recommendation_score ?? 0;
            break;
          case "yield_increase":
            valA = a["yield_increase(%)"] ?? a.yield_increase ?? 0;
            valB = b["yield_increase(%)"] ?? b.yield_increase ?? 0;
            break;
          case "combined_production":
            valA = a["combined_production(t)"] ?? a.combined_production ?? 0;
            valB = b["combined_production(t)"] ?? b.combined_production ?? 0;
            break;
          case "main_crop_yield":
            valA = a["main_crop_yield(t/ha)"] ?? a.main_crop_yield ?? 0;
            valB = b["main_crop_yield(t/ha)"] ?? b.main_crop_yield ?? 0;
            break;
          case "land_sustainability":
            valA = a["land_sustainability(%)"] ?? a.land_sustainability ?? 0;
            valB = b["land_sustainability(%)"] ?? b.land_sustainability ?? 0;
            break;
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [recommendations, searchTerm, sortBy, sortOrder]);

  const handleExportCSV = () => {
    if (!recommendations.length) return;

    const headers = [
      "Main Crop",
      "Main Area (ha)",
      "Main Yield (t/ha)",
      "Main Production (t)",
      "Intercrop",
      "Intercrop Area (ha)",
      "Intercrop Yield (t/ha)",
      "Intercrop Production (t)",
      "Combined Production (t)",
      "Yield Increase (%)",
      "Land Sustainability (%)",
      "Crop Probability (%)",
      "Recommendation Score"
    ];

    const rows = recommendations.map((r) => [
      r.main_crop,
      r["main_area(hectares)"] ?? r.main_area ?? areaHectares,
      r["main_crop_yield(t/ha)"] ?? r.main_crop_yield ?? 0,
      r["main_crop_production(t)"] ?? r.main_crop_production ?? 0,
      r.interm_crop,
      r["intercrop_area(hectares)"] ?? r.intercrop_area ?? 0,
      r["interm_crop_yield(t/ha)"] ?? r.interm_crop_yield ?? 0,
      r["interm_crop_production(t)"] ?? r.interm_crop_production ?? 0,
      r["combined_production(t)"] ?? r.combined_production ?? 0,
      r["yield_increase(%)"] ?? r.yield_increase ?? 0,
      r["land_sustainability(%)"] ?? r.land_sustainability ?? 0,
      r["crop_probability(%)"] ?? r.crop_probability ?? 0,
      r.recommendation_score
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Crop_Recommendation_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Multi-Cropping Performance Table
            </h3>
            <p className="text-xs text-slate-400">
              Detailed agronomic breakdown of intercropping combinations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8.5 w-36 sm:w-48 rounded-lg border border-slate-700 bg-slate-950/70 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3.5">Main Crop</th>
              <th className="py-3 px-3.5">Intercrop</th>
              <th
                onClick={() => handleSort("main_crop_yield")}
                className="cursor-pointer py-3 px-3 hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Main Yield</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3">Intercrop Yield</th>
              <th
                onClick={() => handleSort("combined_production")}
                className="cursor-pointer py-3 px-3 hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Combined (t)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("yield_increase")}
                className="cursor-pointer py-3 px-3 hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Yield Boost</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("land_sustainability")}
                className="cursor-pointer py-3 px-3 hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>Sustainability</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("recommendation_score")}
                className="cursor-pointer py-3 px-3.5 text-right hover:text-slate-200"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filteredAndSorted.map((row, idx) => {
              const yieldIncrease =
                row["yield_increase(%)"] ?? row.yield_increase ?? 0;
              const combinedProd =
                row["combined_production(t)"] ?? row.combined_production ?? 0;
              const mainYield =
                row["main_crop_yield(t/ha)"] ?? row.main_crop_yield ?? 0;
              const mainProd =
                row["main_crop_production(t)"] ?? row.main_crop_production ?? 0;
              const intermYield =
                row["interm_crop_yield(t/ha)"] ?? row.interm_crop_yield ?? 0;
              const intermProd =
                row["interm_crop_production(t)"] ?? row.interm_crop_production ?? 0;
              const intermArea =
                row["intercrop_area(hectares)"] ?? row.intercrop_area ?? 0;
              const sustainability =
                row["land_sustainability(%)"] ?? row.land_sustainability ?? 0;
              const score = row.recommendation_score ?? 0;

              return (
                <tr
                  key={idx}
                  className="transition-colors hover:bg-slate-800/40"
                >
                  <td className="py-3 px-3.5 font-bold text-white capitalize">
                    {formatCropName(row.main_crop)}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 font-medium text-emerald-300 capitalize">
                      {formatCropName(row.interm_crop)}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-semibold text-slate-200">
                      {mainYield.toFixed(2)} t/ha
                    </span>{" "}
                    <span className="text-[10px] text-slate-400">
                      ({mainProd.toFixed(2)} t)
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-semibold text-slate-200">
                      {intermYield.toFixed(2)} t/ha
                    </span>{" "}
                    <span className="text-[10px] text-slate-400">
                      ({intermArea.toFixed(2)} ha)
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                    {combinedProd.toFixed(2)} t
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    +{yieldIncrease.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-teal-300">
                    +{sustainability}%
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-400">
                    {score.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

