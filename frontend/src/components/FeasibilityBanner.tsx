"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { FeasibilityAssessment } from "../types";

interface FeasibilityBannerProps {
  assessment: FeasibilityAssessment | null;
  isLoading?: boolean;
}

export const FeasibilityBanner: React.FC<FeasibilityBannerProps> = ({
  assessment,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="h-4 w-32 rounded bg-slate-800" />
        <div className="h-8 w-48 rounded bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-800" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <Layers className="mb-2 h-8 w-8 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-300">
          Geospatial Feasibility Pending
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Click &quot;Analyze Land &amp; Recommend Crops&quot; to run Sentinel-2 spectral vegetation verification.
        </p>
      </div>
    );
  }

  const isSuitable = assessment.status === "SUITABLE";
  const isMarginal = assessment.status === "MARGINAL";

  const theme = isSuitable
    ? {
        border: "border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-slate-900/90",
        badgeBg: "bg-amber-950/60 text-amber-300 border-amber-500/40",
        title: "Suitable for Cultivation",
        titleColor: "text-emerald-400",
        icon: CheckCircle2,
        ringColor: "text-emerald-400 stroke-emerald-500",
        ringBorder: "border-emerald-500/30"
      }
    : isMarginal
    ? {
        border: "border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-900/90",
        badgeBg: "bg-amber-950/60 text-amber-300 border-amber-500/40",
        title: "Marginally Suitable",
        titleColor: "text-amber-400",
        icon: AlertTriangle,
        ringColor: "text-amber-400 stroke-amber-500",
        ringBorder: "border-amber-500/30"
      }
    : {
        border: "border-rose-900/40 bg-gradient-to-br from-rose-950/30 via-slate-900/80 to-slate-900/90",
        badgeBg: "bg-amber-950/60 text-amber-300 border-amber-500/40",
        title: "Not Suitable",
        titleColor: "text-white font-extrabold",
        icon: XCircle,
        ringColor: "text-emerald-400 stroke-emerald-400",
        ringBorder: "border-emerald-500/40"
      };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 ${theme.border}`}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Left column: Badge, Title, Summary */}
        <div className="flex-1 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-950/50 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <span>REGIONAL BOUNDARY</span>
          </div>

          <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${theme.titleColor}`}>
            {assessment.status === "NOT_SUITABLE" ? "Not Suitable" : theme.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {assessment.summary}
          </p>

          {/* Diagnostic Reasons */}
          {assessment.reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 pt-1">
              {assessment.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: AI Confidence Score Ring */}
        <div className="flex items-center justify-end sm:justify-center">
          <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-emerald-500/50 bg-slate-950/80 shadow-lg shadow-emerald-950/50">
            <span className="text-xl font-black text-white">
              {assessment.confidenceScore}%
            </span>
            <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">
              AI CONFIDENCE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

