export interface GeospatialData {
  available: boolean;
  NDVI?: number | null;
  NDWI?: number | null;
  NDMI?: number | null;
  EVI?: number | null;
  GNDVI?: number | null;
  NDSI?: number | null;
  image_date?: string | null;
  image_count?: number | null;
}

export interface GeospatialResponse {
  success: boolean;
  message?: string;
  error?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  search_period?: {
    start: string;
    end: string;
  };
  geospatial: GeospatialData;
}

export interface SoilDataDetails {
  latitude?: number;
  longitude?: number;
  clay?: number;
  clay_percent?: number;
  sand?: number;
  sand_percent?: number;
  silt?: number;
  silt_percent?: number;
  phh2o?: number;
  soc?: number;
  soc_g_per_kg?: number;
  nitrogen?: number;
  nitrogen_g_per_kg?: number;
  nitrogen_original?: number;
  nearby?: boolean;
  search_distance_km?: number;
}

export interface SoilResponse {
  available: boolean;
  message?: string;
  data?: SoilDataDetails;
}

export interface WeatherDataDetails {
  available: boolean;
  date?: string;
  days_back?: number;
  humidity_percent?: number;
  is_today?: boolean;
  latitude?: number;
  longitude?: number;
  rainfall_mm?: number;
  temperature_c?: number;
}

export interface WeatherResponse {
  available: boolean;
  message?: string;
  data?: WeatherDataDetails;
}

export interface ModelInputs {
  N_g_per_kg: number;
  pH: number;
  temperature_C: number;
  humidity_percent: number;
  rainfall_mm: number;
  area_hectares: number;
}

export interface CropRecommendation {
  main_crop: string;
  main_crop_yield?: number;
  "main_crop_yield(t/ha)"?: number;
  main_crop_production?: number;
  "main_crop_production(t)"?: number;
  main_area?: number;
  "main_area(hectares)"?: number;
  interm_crop: string;
  interm_crop_yield?: number;
  "interm_crop_yield(t/ha)"?: number;
  interm_crop_production?: number;
  "interm_crop_production(t)"?: number;
  intercrop_area?: number;
  "intercrop_area(hectares)"?: number;
  combined_production?: number;
  "combined_production(t)"?: number;
  interm_land_cover?: number;
  "interm_land_cover(%)"?: number;
  land_sustainability?: number;
  "land_sustainability(%)"?: number;
  crop_probability?: number;
  "crop_probability(%)"?: number;
  yield_increase?: number;
  "yield_increase(%)"?: number;
  recommendation_score: number;
}

export interface RecommendationResponse {
  success: boolean;
  error?: string;
  message?: string;
  missing?: string[];
  location: {
    latitude: number;
    longitude: number;
    area_hectares: number;
  };
  model_inputs: ModelInputs;
  soil: SoilResponse;
  weather: WeatherResponse;
  recommendations: CropRecommendation[];
}

export type FeasibilityStatus = "SUITABLE" | "MARGINAL" | "NOT_SUITABLE";

export interface FeasibilityAssessment {
  status: FeasibilityStatus;
  statusLabel: string;
  isVegetationPossible: boolean;
  confidenceScore: number;
  summary: string;
  reasons: string[];
  spectralIndices: {
    ndvi: number;
    ndwi: number;
    ndmi: number;
    evi: number;
    gndvi?: number;
    ndsi?: number;
  };
}

export interface PresetLocation {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  area: number;
  description: string;
  soilSalinityPreset?: string;
}

