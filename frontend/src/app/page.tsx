"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  AlertCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Satellite,
  Layers,
  Sprout,
  Activity,
  ArrowRight
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TargetCoordinates } from "../components/TargetCoordinates";
import { FeasibilityBanner } from "../components/FeasibilityBanner";
import { SpectralIndicesCard } from "../components/SpectralIndicesCard";
import { WeatherCard } from "../components/WeatherCard";
import { SoilPropertiesCard } from "../components/SoilPropertiesCard";
import { CropRecommendationCards } from "../components/CropRecommendationCards";
import { CropComparisonTable } from "../components/CropComparisonTable";
import { YieldAnalyticsChart } from "../components/YieldAnalyticsChart";
import {
  fetchGeospatialData,
  fetchCropRecommendations,
  evaluateFeasibility,
  getSimulatedGeospatial,
  getSimulatedRecommendation
} from "../services/api";
import {
  GeospatialResponse,
  RecommendationResponse,
  FeasibilityAssessment
} from "../types";

export default function Home() {
  // Farm coordinates and parameters (Default: Deccan Semi-Arid Basin, India)
  const [latitude, setLatitude] = useState<number>(17.385);
  const [longitude, setLongitude] = useState<number>(78.4867);
  const [area, setArea] = useState<number>(2.5);
  const [soilSalinity, setSoilSalinity] = useState<string>(
    "Low Salinity (Optimal Cropland)"
  );

  // System states
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<
    "geospatial" | "recommendation" | null
  >(null);

  // Response payloads (Empty initially until Analyze is clicked)
  const [geospatialData, setGeospatialData] =
    useState<GeospatialResponse | null>(null);
  const [feasibility, setFeasibility] =
    useState<FeasibilityAssessment | null>(null);
  const [recommendations, setRecommendations] =
    useState<RecommendationResponse | null>(null);

  // Notifications & errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  /**
   * Main Two-Stage Pipeline:
   * 1. Check Sentinel-2 geospatial vegetation possibility
   * 2. If feasible, auto-call crop recommendation model
   */
  const handleAnalyze = async () => {
    setErrorMsg(null);
    setNoticeMsg(null);
    setIsLoading(true);
    setActiveStage("geospatial");
    setRecommendations(null);

    try {
      let geoRes: GeospatialResponse;

      if (isLiveApi) {
        try {
          geoRes = await fetchGeospatialData(latitude, longitude);
        } catch (apiError: unknown) {
          const errText =
            apiError instanceof Error ? apiError.message : "API Connection error";
          setNoticeMsg(
            `Could not reach live backend at http://localhost:5000 (${errText}). Switched to high-fidelity AI simulation mode.`
          );
          geoRes = getSimulatedGeospatial(latitude, longitude);
        }
      } else {
        geoRes = getSimulatedGeospatial(latitude, longitude);
      }

      setGeospatialData(geoRes);
      const assessment = evaluateFeasibility(geoRes);
      setFeasibility(assessment);

      // Check whether vegetation is possible
      if (!assessment.isVegetationPossible) {
        // Stop here: Non-arable or arid terrain
        setNoticeMsg(
          `Geospatial verification check determined land is "${assessment.statusLabel}". Crop recommendation halted to prevent crop failure.`
        );
        setIsLoading(false);
        setActiveStage(null);
        return;
      }

      // If vegetation is possible, automatically trigger crop recommendation!
      setActiveStage("recommendation");
      let recRes: RecommendationResponse;

      if (isLiveApi) {
        try {
          recRes = await fetchCropRecommendations(latitude, longitude, area);
        } catch (recApiError: unknown) {
          const errText =
            recApiError instanceof Error
              ? recApiError.message
              : "Recommendation API error";
          setNoticeMsg(
            `Live crop recommendation backend unavailable (${errText}). Rendered algorithmic ML forecast.`
          );
          recRes = getSimulatedRecommendation(latitude, longitude, area);
        }
      } else {
        recRes = getSimulatedRecommendation(latitude, longitude, area);
      }

      setRecommendations(recRes);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing analysis";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setActiveStage(null);
    }
  };

  /**
   * Force Crop Recommendation even if geospatial marked as Not Suitable
   */
  const handleForceRecommendation = async () => {
    setIsLoading(true);
    setActiveStage("recommendation");
    setErrorMsg(null);

    try {
      let recRes: RecommendationResponse;
      if (isLiveApi) {
        try {
          recRes = await fetchCropRecommendations(latitude, longitude, area);
        } catch {
          recRes = getSimulatedRecommendation(latitude, longitude, area);
        }
      } else {
        recRes = getSimulatedRecommendation(latitude, longitude, area);
      }
      setRecommendations(recRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing analysis";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setActiveStage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        isLiveApi={isLiveApi}
        onToggleApiMode={() => setIsLiveApi((prev) => !prev)}
        isLoading={isLoading}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Notice or Error Alerts */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300 backdrop-blur-md shadow-lg">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {noticeMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3.5 text-xs text-amber-300 backdrop-blur-md shadow-lg">
            <Zap className="h-4 w-4 shrink-0 text-amber-400" />
            <div className="flex-1">{noticeMsg}</div>
          </div>
        )}

        {/* Top Split Layout: Left (Target Coordinates + Map) | Right (Feasibility Banner + Telemetry) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Target Coordinates, Map, and Controls (4 cols on desktop) */}
          <div className="lg:col-span-4">
            <TargetCoordinates
              latitude={latitude}
              longitude={longitude}
              area={area}
              soilSalinity={soilSalinity}
              onLatitudeChange={setLatitude}
              onLongitudeChange={setLongitude}
              onAreaChange={setArea}
              onSoilSalinityChange={setSoilSalinity}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              activeStage={activeStage}
            />
          </div>

          {/* Right Column: Feasibility Banner, Spectral Indices & Weather (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-5">
            {/* If no analysis performed yet, display Initial Ready Hero Banner */}
            {!feasibility && !isLoading ? (
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Satellite className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                      Satellite Land Verification &amp; Crop Recommendation
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Select coordinates or pick a preset from the left panel, then click &quot;Analyze Land &amp; Recommend Crops&quot;.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold">1</span>
                      <span>Geospatial Remote Sensing</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Queries Sentinel-2 multispectral bands (NDVI, NDWI, NDMI, EVI) to verify whether vegetation is possible.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold">2</span>
                      <span>Soil &amp; Weather Ingestion</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Retrieves SoilGrids chemistry (N, pH, SOC, Clay %, Sand %) and LSTM weather forecasts.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[11px] font-bold">3</span>
                      <span>Intercrop Yield Ranking</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Predicts optimal main &amp; companion crops with sustainability score and complete performance tables.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Selected Region: {latitude}°N, {longitude}°E</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Run Analysis Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Feasibility Assessment Banner */}
                <FeasibilityBanner
                  assessment={feasibility}
                  isLoading={isLoading && activeStage === "geospatial"}
                />

                {/* Non-suitable Warning & Override option */}
                {feasibility && !feasibility.isVegetationPossible && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-slate-900/90 p-4 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>
                        Vegetation viability index is low (NDVI &lt; 0.12 or water body). Automatic recommendation was skipped.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleForceRecommendation}
                      disabled={isLoading}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/60 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 transition-colors"
                    >
                      <Play className="h-3 w-3" />
                      <span>Force Run Recommendation</span>
                    </button>
                  </div>
                )}

                {/* Telemetry 2-Column Grid: Spectral Indices (left) + Weather & Soil (right) */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Sentinel-2 Spectral Indices */}
                  <SpectralIndicesCard
                    geospatial={geospatialData?.geospatial}
                    isLoading={isLoading && activeStage === "geospatial"}
                  />

                  {/* LSTM Weather Forecast */}
                  <WeatherCard
                    weather={recommendations?.weather}
                    isLoading={isLoading && activeStage === "recommendation"}
                  />
                </div>

                {/* SoilGrids Chemistry & Texture Card */}
                <SoilPropertiesCard
                  soil={recommendations?.soil}
                  isLoading={isLoading && activeStage === "recommendation"}
                />
              </>
            )}
          </div>
        </div>

        {/* Section 2: Crop Recommendations & Intercropping Ranking */}
        {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
          <div className="space-y-6 pt-2">
            {/* Top Crop Cards */}
            <CropRecommendationCards
              recommendations={recommendations.recommendations}
              areaHectares={area}
              isLoading={isLoading && activeStage === "recommendation"}
            />

            {/* Visual Yield Analytics & Stacked Comparison */}
            <YieldAnalyticsChart
              recommendations={recommendations.recommendations}
            />

            {/* Comprehensive Multi-Cropping Comparison Table */}
            <CropComparisonTable
              recommendations={recommendations.recommendations}
              areaHectares={area}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          AgriPulse AI &bull; Satellite Geospatial Remote Sensing &amp; Machine Learning Crop Recommendation Engine
        </p>
      </footer>
    </div>
  );
}
