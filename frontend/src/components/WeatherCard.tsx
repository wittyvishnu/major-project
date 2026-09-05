"use client";

import React from "react";
import {
  CloudSun,
  Thermometer,
  Droplets,
  CloudRain,
  Gauge,
  Calendar
} from "lucide-react";
import { WeatherResponse } from "../types";

interface WeatherCardProps {
  weather?: WeatherResponse | null;
  isLoading?: boolean;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  isLoading
}) => {
  const data = weather?.data;
  const temp = data?.temperature_c ?? 21.99;
  const humidity = data?.humidity_percent ?? 40.66;
  const rainfall = data?.rainfall_mm ?? 0;
  const pressure = 101.1; // Standard barometric pressure

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Weather Condition
          </h3>
        </div>
        <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-300">
        4 fields
        </span>
      </div>

      {/* 2x2 Telemetry Grid matching screenshot */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Temperature */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/20">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Temperature
            </div>
            <div className="text-base font-bold text-white font-mono">
              {temp.toFixed(1)} °C
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/20">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Humidity
            </div>
            <div className="text-base font-bold text-white font-mono">
              {humidity.toFixed(0)} %
            </div>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/20">
            <CloudRain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Precipitation
            </div>
            <div className="text-base font-bold text-white font-mono">
              {rainfall.toFixed(1)} mm
            </div>
          </div>
        </div>

        {/* Pressure */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-950/80 text-teal-400 border border-teal-500/20">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Pressure
            </div>
            <div className="text-base font-bold text-white font-mono">
              {pressure} kPa
            </div>
          </div>
        </div>
      </div>

      {data?.date && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-800/70 pt-2.5">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Observation Date: {data.date} (Recorded {data.days_back ?? 0}d ago)</span>
        </div>
      )}
    </div>
  );
};

