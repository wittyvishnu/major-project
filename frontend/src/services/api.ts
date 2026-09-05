import {
  GeospatialResponse,
  RecommendationResponse,
  FeasibilityAssessment,
  PresetLocation,
  CropRecommendation
} from "../types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const REGIONAL_PRESETS: PresetLocation[] = [
  {
    id: "deccan-plateau",
    name: "Deccan Semi-Arid Basin",
    region: "Telangana / Hyderabad Agro Zone",
    latitude: 17.385,
    longitude: 78.4867,
    area: 2.5,
    description: "Red sandy-loam soil with pulse, millet, and oilseed rotations.",
    soilSalinityPreset: "Low Salinity (Optimal Cropland)"
  },
  {
    id: "punjab-belt",
    name: "Punjab Indo-Gangetic Plain",
    region: "Ludhiana / Central Punjab",
    latitude: 30.901,
    longitude: 75.8573,
    area: 3.5,
    description: "High biomass wheat-rice fertile alluvial plain with extensive canal irrigation.",
    soilSalinityPreset: "Low Salinity (Optimal Cropland)"
  },
  {
    id: "cauvery-delta",
    name: "Cauvery Delta Basin",
    region: "Thanjavur, Tamil Nadu (Rice Bowl)",
    latitude: 10.787,
    longitude: 79.1378,
    area: 2.0,
    description: "Alluvial deltaic soil, high vegetative canopy with pulse and paddy rotation.",
    soilSalinityPreset: "Low Salinity (Optimal Cropland)"
  },
  {
    id: "malwa-plateau",
    name: "Malwa Fertile Plateau",
    region: "Indore / Ujjain, Madhya Pradesh",
    latitude: 22.7196,
    longitude: 75.8577,
    area: 3.0,
    description: "Deep black cotton soil (Regur) with high moisture retention, soybean & pulses.",
    soilSalinityPreset: "Low Salinity (Optimal Cropland)"
  },
  {
    id: "godavari-basin",
    name: "Godavari Alluvial Plain",
    region: "East Godavari, Andhra Pradesh",
    latitude: 16.9891,
    longitude: 81.784,
    area: 2.8,
    description: "Rich deltaic silt with sugarcane, maize, and pulse multi-cropping.",
    soilSalinityPreset: "Low Salinity (Optimal Cropland)"
  },
  {
    id: "krishna-valley",
    name: "Krishna River Valley",
    region: "Kolhapur / Sangli, Maharashtra",
    latitude: 16.705,
    longitude: 74.2433,
    area: 2.2,
    description: "Fertile river valley soil optimal for sugarcane and intercropped legumes.",
    soilSalinityPreset: "Low Salinity (Optimal Cropland)"
  },
  {
    id: "thar-desert",
    name: "Thar Desert Arid Zone",
    region: "Jaisalmer, Western Rajasthan",
    latitude: 26.9157,
    longitude: 70.9083,
    area: 5.0,
    description: "Hyper-arid sandy desert terrain with low NDVI and non-vegetated sand dunes.",
    soilSalinityPreset: "High Salinity (Saline Barren Land)"
  },
  {
    id: "kutch-saline",
    name: "Kutch Saline Marsh",
    region: "Rann of Kutch, Gujarat",
    latitude: 23.834,
    longitude: 70.08,
    area: 4.0,
    description: "High salinity seasonal salt flat and barren coastal wetland.",
    soilSalinityPreset: "High Salinity (Saline Barren Land)"
  }
];

/**
 * Fetch Sentinel-2 Geospatial spectral indices from Flask backend
 */
export async function fetchGeospatialData(
  latitude: number,
  longitude: number
): Promise<GeospatialResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/geospatialData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude,
        longitude
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(
        errJson?.error ||
          errJson?.message ||
          `Geospatial API responded with status ${res.status}`
      );
    }

    const data: GeospatialResponse = await res.json();
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to connect to backend";
    console.warn("Geospatial API fetch error:", msg, "- Falling back to simulated calculation if needed.");
    throw new Error(msg);
  }
}

/**
 * Fetch Crop Recommendations from Flask backend
 */
export async function fetchCropRecommendations(
  latitude: number,
  longitude: number,
  area: number
): Promise<RecommendationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude,
        longitude,
        area
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(
        errJson?.error ||
          errJson?.message ||
          `Crop Recommendation API responded with status ${res.status}`
      );
    }

    const data: RecommendationResponse = await res.json();
    return data;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to connect to backend";
    console.warn("Recommendation API fetch error:", msg);
    throw new Error(msg);
  }
}

/**
 * Evaluates whether vegetation and crop cultivation is feasible
 * based on satellite spectral indices (NDVI, NDWI, NDMI, EVI).
 */
export function evaluateFeasibility(
  geospatialResponse: GeospatialResponse
): FeasibilityAssessment {
  const geo = geospatialResponse.geospatial;
  const ndvi = typeof geo?.NDVI === "number" ? geo.NDVI : 0.05;
  const ndwi = typeof geo?.NDWI === "number" ? geo.NDWI : -0.5;
  const ndmi = typeof geo?.NDMI === "number" ? geo.NDMI : 0.05;
  const evi = typeof geo?.EVI === "number" ? geo.EVI : 0.05;
  const gndvi = typeof geo?.GNDVI === "number" ? geo.GNDVI : Math.max(0.02, ndvi * 0.9);
  const ndsi = typeof geo?.NDSI === "number" ? geo.NDSI : Math.max(0.01, 0.45 - ndvi * 0.4);

  const reasons: string[] = [];
  let isVegetationPossible = false;
  let status: "SUITABLE" | "MARGINAL" | "NOT_SUITABLE" = "NOT_SUITABLE";
  let confidenceScore = 85.0;
  let summary = "";

  // 1. Water body check
  if (ndwi > 0.25) {
    status = "NOT_SUITABLE";
    isVegetationPossible = false;
    confidenceScore = Math.min(99.4, 88 + ndwi * 30);
    summary = "Standing water body or submerged marshland detected. Not suitable for standard terrestrial agriculture.";
    reasons.push(`High NDWI (${ndwi.toFixed(3)}) indicates open water or flooded surface.`);
  }
  // 2. Severe arid / barren / rocky desert check
  else if (ndvi < 0.12) {
    status = "NOT_SUITABLE";
    isVegetationPossible = false;
    confidenceScore = Math.min(98.8, 92 + (0.12 - ndvi) * 50);
    summary = "Arid, water-body, or non-vegetated terrain. Not recommended for standard agriculture without extensive soil reclamation.";
    reasons.push(`Critically low NDVI (${ndvi.toFixed(3)}) indicates absence of photosynthetically active biomass.`);
    if (ndmi < 0.1) {
      reasons.push(`Low moisture index NDMI (${ndmi.toFixed(3)}) confirms hyper-dry surface soil.`);
    }
  }
  // 3. Moderate / Marginal vegetation (arid transition or sparse scrub)
  else if (ndvi < 0.22) {
    status = "MARGINAL";
    isVegetationPossible = true;
    confidenceScore = 78.5;
    summary = "Marginal sparse vegetation detected. Suitable for drought-resistant legumes, millets, or dryland farming with supplemental irrigation.";
    reasons.push(`Moderate NDVI (${ndvi.toFixed(3)}) reflects semi-arid or transitional land cover.`);
    if (evi < 0.15) {
      reasons.push(`Low Enhanced Vegetation Index (${evi.toFixed(3)}) indicates sparse vegetative canopy.`);
    }
  }
  // 4. Good / High Vegetation (Cropland / Fertile Land)
  else {
    status = "SUITABLE";
    isVegetationPossible = true;
    confidenceScore = Math.min(98.5, 82 + ndvi * 25);
    summary = "Optimal arable cropland with active photosynthetic vegetation and healthy canopy moisture.";
    reasons.push(`Healthy NDVI (${ndvi.toFixed(3)}) demonstrates viable photosynthetic plant density.`);
    reasons.push(`Favorable canopy moisture (NDMI: ${ndmi.toFixed(3)}) and biomass vigour (EVI: ${evi.toFixed(3)}).`);
  }

  const statusLabel =
    status === "SUITABLE"
      ? "Vegetation Suitable"
      : status === "MARGINAL"
      ? "Marginally Suitable"
      : "Not Suitable";

  return {
    status,
    statusLabel,
    isVegetationPossible,
    confidenceScore: Number(confidenceScore.toFixed(1)),
    summary,
    reasons,
    spectralIndices: {
      ndvi: Number(ndvi.toFixed(3)),
      ndwi: Number(ndwi.toFixed(3)),
      ndmi: Number(ndmi.toFixed(3)),
      evi: Number(evi.toFixed(3)),
      gndvi: Number(gndvi.toFixed(3)),
      ndsi: Number(ndsi.toFixed(3))
    }
  };
}

/**
 * Generate simulated fallback data when backend is not running or initializing
 */
export function getSimulatedGeospatial(lat: number, lon: number): GeospatialResponse {
  // Check if coordinates correspond to hyper-arid Thar desert or Kutch salt flats
  const isDesert =
    (lat > 25 && lat < 28 && lon < 72) ||
    (lat > 23 && lat < 24.5 && lon < 71) ||
    (lat > 32 && lon > 40);

  const ndvi = isDesert ? 0.08 : 0.558;
  const ndwi = isDesert ? -0.65 : -0.485;
  const ndmi = isDesert ? 0.05 : 0.321;
  const evi = isDesert ? 0.07 : 3.662;

  return {
    success: true,
    location: {
      latitude: lat,
      longitude: lon
    },
    search_period: {
      start: "2024-08-30",
      end: "2026-08-30"
    },
    geospatial: {
      available: true,
      NDVI: ndvi,
      NDWI: ndwi,
      NDMI: ndmi,
      EVI: evi,
      GNDVI: isDesert ? 0.09 : 0.48,
      NDSI: isDesert ? 0.45 : 0.08,
      image_date: "2025-12-13",
      image_count: 148
    }
  };
}

export function getSimulatedRecommendation(
  lat: number,
  lon: number,
  area: number
): RecommendationResponse {
  return {
    success: true,
    location: {
      latitude: lat,
      longitude: lon,
      area_hectares: area
    },
    model_inputs: {
      N_g_per_kg: 2.07,
      pH: 7.5,
      temperature_C: 21.99,
      humidity_percent: 40.66,
      rainfall_mm: 0.0,
      area_hectares: area
    },
    soil: {
      available: true,
      data: {
        latitude: lat,
        longitude: lon,
        nitrogen_g_per_kg: 2.07,
        phh2o: 7.5,
        soc_g_per_kg: 31.9,
        clay_percent: 24.0,
        sand_percent: 27.7,
        silt_percent: 48.3,
        search_distance_km: 0
      }
    },
    weather: {
      available: true,
      data: {
        available: true,
        date: "2026-08-26",
        days_back: 4,
        humidity_percent: 40.66,
        is_today: false,
        latitude: lat,
        longitude: lon,
        rainfall_mm: 0.0,
        temperature_c: 21.99
      }
    },
    recommendations: [
      {
        main_crop: "mothbeans",
        "main_crop_yield(t/ha)": 1.5,
        "main_crop_production(t)": Number((1.5 * area).toFixed(2)),
        "main_area(hectares)": area,
        interm_crop: "millet",
        "interm_crop_yield(t/ha)": 2.03,
        "interm_crop_production(t)": Number((1.27 * (area / 2.5)).toFixed(2)),
        "intercrop_area(hectares)": Number((0.62 * (area / 2.5)).toFixed(2)),
        "combined_production(t)": Number((5.01 * (area / 2.5)).toFixed(2)),
        "interm_land_cover(%)": 25,
        "land_sustainability(%)": 12,
        "crop_probability(%)": 47.4,
        "yield_increase(%)": 33.88,
        recommendation_score: 36.78
      },
      {
        main_crop: "mothbeans",
        "main_crop_yield(t/ha)": 1.5,
        "main_crop_production(t)": Number((1.5 * area).toFixed(2)),
        "main_area(hectares)": area,
        interm_crop: "sesame",
        "interm_crop_yield(t/ha)": 1.4,
        "interm_crop_production(t)": Number((0.7 * (area / 2.5)).toFixed(2)),
        "intercrop_area(hectares)": Number((0.5 * (area / 2.5)).toFixed(2)),
        "combined_production(t)": Number((4.44 * (area / 2.5)).toFixed(2)),
        "interm_land_cover(%)": 20,
        "land_sustainability(%)": 10,
        "crop_probability(%)": 47.4,
        "yield_increase(%)": 18.76,
        recommendation_score: 36.18
      },
      {
        main_crop: "muskmelon",
        "main_crop_yield(t/ha)": 3.5,
        "main_crop_production(t)": Number((3.5 * area).toFixed(2)),
        "main_area(hectares)": area,
        interm_crop: "blackgram",
        "interm_crop_yield(t/ha)": 1.85,
        "interm_crop_production(t)": Number((1.15 * (area / 2.5)).toFixed(2)),
        "intercrop_area(hectares)": Number((0.62 * (area / 2.5)).toFixed(2)),
        "combined_production(t)": Number((9.89 * (area / 2.5)).toFixed(2)),
        "interm_land_cover(%)": 25,
        "land_sustainability(%)": 12,
        "crop_probability(%)": 32.4,
        "yield_increase(%)": 13.21,
        recommendation_score: 26.28
      }
    ]
  };
}

export function formatCropName(crop: string): string {
  if (!crop) return "";
  return crop.charAt(0).toUpperCase() + crop.slice(1);
}
