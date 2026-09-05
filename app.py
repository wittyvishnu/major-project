from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import numpy as np
import joblib
import requests
import ee
import time

from datetime import datetime
from zoneinfo import ZoneInfo


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)
CORS(app)


# =========================================================
# FILES
# =========================================================

RECOMMENDATION_MODEL = "crop_recommedation.pkl"
YIELD_MODEL = "crop_yield_model.pkl"
INTERCROP_DATASET = "Crop_recommendation_with_intercrops.csv"


# =========================================================
# LOAD MODELS
# =========================================================

main_crop_model = joblib.load(
    RECOMMENDATION_MODEL
)

yield_model = joblib.load(
    YIELD_MODEL
)

print("Crop recommendation model loaded")
print("Yield model loaded")


# =========================================================
# GOOGLE EARTH ENGINE
# =========================================================

try:

    ee.Initialize(
        project="ai-agriculture-487915"
    )

    print("Google Earth Engine initialized")

except Exception as e:

    print(
        "Google Earth Engine initialization failed:"
    )

    print(e)

    print(
        "Run: earthengine authenticate"
    )


# =========================================================
# LOAD INTERCROP DATA
# =========================================================

df = pd.read_csv(
    INTERCROP_DATASET
)


# =========================================================
# RENAME COLUMNS
# =========================================================

df = df.rename(columns={

    "label":
        "main_crop",

    "inter_land_cover(%)":
        "interm_land_cover",

    "land_sustainability(%)":
        "land_sustainability"

})


# =========================================================
# NORMALIZE CROP NAMES
# =========================================================

df["main_crop"] = (
    df["main_crop"]
    .astype(str)
    .str.strip()
    .str.lower()
)

df["interm_crop"] = (
    df["interm_crop"]
    .astype(str)
    .str.strip()
    .str.lower()
)


# =========================================================
# SOILGRIDS
# =========================================================

def get_soil_data(
    lat,
    lon,
    radius=0.02,
    step=0.005
):

    """
    Get soil properties from SoilGrids.

    Exact location is checked first.

    If no data is available,
    nearby locations are searched.
    """

    def query(
        query_lat,
        query_lon
    ):

        url = (
            "https://rest.isric.org/"
            "soilgrids/v2.0/properties/query"
        )


        params = {

            "lat":
                query_lat,

            "lon":
                query_lon,

            "property": [

                "phh2o",

                "nitrogen",

                "soc",

                "clay",

                "sand",

                "silt"

            ],

            "depth":
                "0-5cm",

            "value":
                "mean"

        }


        for attempt in range(1, 4):

            try:

                response = requests.get(
                    url,
                    params=params,
                    timeout=30,
                    headers={
                        "User-Agent": "Mozilla/5.0"
                    }
                )

                if response.status_code == 200:
                    break

                if response.status_code == 503:
                    print(
                        f"SoilGrids 503 on attempt {attempt}/3. Retrying..."
                    )
                    time.sleep(2 * attempt)
                    continue

                print(
                    "SoilGrids HTTP:",
                    response.status_code
                )
                return None

            except requests.RequestException as e:

                print(
                    "SoilGrids request error:",
                    e
                )

                if attempt < 3:
                    time.sleep(2 * attempt)
                    continue

                return None


        else:
            return None


        if response.status_code != 200:

            print(
                "SoilGrids HTTP:",
                response.status_code
            )

            return None


        try:

            data = response.json()

        except Exception:

            return None


        if (
            "properties" not in data
            or
            "layers" not in data["properties"]
        ):

            return None


        result = {

            "latitude":
                query_lat,

            "longitude":
                query_lon

        }


        valid = False


        for layer in (
            data["properties"]["layers"]
        ):

            name = layer["name"]


            try:

                value = (

                    layer["depths"][0]
                    ["values"]["mean"]

                )

            except (
                KeyError,
                IndexError,
                TypeError
            ):

                value = None


            if value is not None:

                valid = True


            result[name] = value


        if not valid:

            return None


        # =================================================
        # SOILGRIDS CONVERSIONS
        # =================================================

        # pH
        if result.get("phh2o") is not None:

            result["phh2o"] = (
                result["phh2o"] / 10.0
            )


        # Nitrogen
        #
        # Example:
        # 1203 -> 12.03 g/kg

        if result.get("nitrogen") is not None:

            result["nitrogen_original"] = (
                result["nitrogen"]
            )

            result["nitrogen_g_per_kg"] = (
                result["nitrogen"] / 100.0
            )


        # SOC
        if result.get("soc") is not None:

            result["soc_g_per_kg"] = (
                result["soc"] / 10.0
            )


        # Soil texture
        if result.get("clay") is not None:

            result["clay_percent"] = (
                result["clay"] / 10.0
            )


        if result.get("sand") is not None:

            result["sand_percent"] = (
                result["sand"] / 10.0
            )


        if result.get("silt") is not None:

            result["silt_percent"] = (
                result["silt"] / 10.0
            )


        return result


    # =====================================================
    # EXACT LOCATION
    # =====================================================

    soil = query(
        lat,
        lon
    )


    if soil:

        soil["nearby"] = False

        soil["search_distance_km"] = 0

        return soil


    # =====================================================
    # SEARCH NEARBY
    # =====================================================

    distance = step


    while distance <= radius:

        offsets = [

            (distance, 0),

            (-distance, 0),

            (0, distance),

            (0, -distance),

            (distance, distance),

            (distance, -distance),

            (-distance, distance),

            (-distance, -distance)

        ]


        for dx, dy in offsets:

            soil = query(

                lat + dy,

                lon + dx

            )


            if soil:

                print(
                    "Nearby SoilGrids data found:"
                    f" {distance * 111:.2f} km"
                )


                soil["nearby"] = True

                soil["search_distance_km"] = round(
                    distance * 111,
                    2
                )


                return soil


        distance += step


    return None


# =========================================================
# NASA POWER WEATHER
# =========================================================

def get_weather_data(
    lat,
    lon
):

    """
    Check NASA POWER weather:

    Today
    1 day back
    ...
    7 days back

    Returns the most recent valid data.
    """

    url = (
        "https://power.larc.nasa.gov/"
        "api/temporal/daily/point"
    )


    today = datetime.now(
        ZoneInfo("Asia/Kolkata")
    ).date()


    # =====================================================
    # CHECK LAST 7 DAYS
    # =====================================================

    for days_back in range(3, 8):

        target_date = (

            today -
            pd.Timedelta(
                days=days_back
            )

        ).strftime("%Y%m%d")


        params = {

            "parameters":
                "T2M,PRECTOTCORR,RH2M",

            "community":
                "AG",

            "longitude":
                lon,

            "latitude":
                lat,

            "start":
                target_date,

            "end":
                target_date,

            "format":
                "JSON"

        }


        try:

            response = requests.get(

                url,

                params=params,

                timeout=30

            )

        except requests.RequestException as e:

            print(
                "NASA request error:",
                e
            )

            continue


        if response.status_code != 200:

            print(
                f"NASA HTTP {response.status_code}"
                f" for {target_date}"
            )

            continue


        try:

            data = response.json()

            parameters = (
                data["properties"]["parameter"]
            )

        except Exception as e:

            print(
                "NASA response error:",
                e
            )

            continue


        if target_date not in parameters["T2M"]:

            continue


        temperature = parameters[
            "T2M"
        ][target_date]


        rainfall = parameters[
            "PRECTOTCORR"
        ][target_date]


        humidity = parameters[
            "RH2M"
        ][target_date]


        # =================================================
        # -999 = MISSING
        # =================================================

        values = [

            temperature,

            rainfall,

            humidity

        ]


        invalid = any(

            value is None

            or

            float(value) <= -900

            for value in values

        )


        if invalid:

            print(
                f"Invalid NASA data for "
                f"{target_date}: "
                f"T={temperature}, "
                f"R={rainfall}, "
                f"H={humidity}"
            )

            continue


        print(
            f"Valid NASA weather found: "
            f"{target_date}"
        )


        return {

            "available":
                True,

            "latitude":
                lat,

            "longitude":
                lon,

            "date":
                target_date,

            "temperature_c":
                round(
                    float(temperature),
                    2
                ),

            "rainfall_mm":
                round(
                    float(rainfall),
                    2
                ),

            "humidity_percent":
                round(
                    float(humidity),
                    2
                ),

            "days_back":
                days_back,

            "is_today":
                days_back == 0

        }


    # =====================================================
    # NO WEATHER DATA
    # =====================================================

    return {

        "available":
            False,

        "latitude":
            lat,

        "longitude":
            lon,

        "message":
            "No valid NASA POWER weather data "
            "found in the last 7 days."

    }


# =========================================================
# GOOGLE EARTH ENGINE
# =========================================================

def get_indices(
    lat,
    lon,
    start_date,
    end_date
):

    """
    Get NDVI, EVI, NDMI and NDWI
    from Sentinel-2.
    """

    try:

        point = ee.Geometry.Point([
            lon,
            lat
        ])


        # =================================================
        # SENTINEL-2
        # =================================================

        collection = (

            ee.ImageCollection(
                "COPERNICUS/S2_SR_HARMONIZED"
            )

            .filterBounds(point)

            .filterDate(
                start_date,
                end_date
            )

            .filter(
                ee.Filter.lt(
                    "CLOUDY_PIXEL_PERCENTAGE",
                    20
                )
            )

            .sort(
                "CLOUDY_PIXEL_PERCENTAGE"
            )

        )


        # =================================================
        # CHECK IMAGE COUNT
        # =================================================

        image_count = (
            collection.size().getInfo()
        )


        if image_count == 0:

            return None


        # =================================================
        # LEAST CLOUDY IMAGE
        # =================================================

        image = collection.first()


        # =================================================
        # NDVI
        # =================================================

        ndvi = (

            image

            .normalizedDifference(
                [
                    "B8",
                    "B4"
                ]
            )

            .rename("NDVI")

        )


        # =================================================
        # NDMI
        # =================================================

        ndmi = (

            image

            .normalizedDifference(
                [
                    "B8",
                    "B11"
                ]
            )

            .rename("NDMI")

        )


        # =================================================
        # NDWI
        # =================================================

        ndwi = (

            image

            .normalizedDifference(
                [
                    "B3",
                    "B8"
                ]
            )

            .rename("NDWI")

        )


        # =================================================
        # EVI
        # =================================================

        evi = (

            image.expression(

                """
                2.5 * (
                    (NIR - RED)
                    /
                    (
                        NIR
                        +
                        6 * RED
                        -
                        7.5 * BLUE
                        +
                        1
                    )
                )
                """,

                {

                    "NIR":
                        image.select("B8"),

                    "RED":
                        image.select("B4"),

                    "BLUE":
                        image.select("B2")

                }

            )

            .rename("EVI")

        )


        # =================================================
        # COMBINE
        # =================================================

        indices = (

            ndvi

            .addBands(evi)

            .addBands(ndmi)

            .addBands(ndwi)

        )


        # =================================================
        # PIXEL VALUE
        # =================================================

        result = (

            indices

            .reduceRegion(

                reducer=
                    ee.Reducer.first(),

                geometry=
                    point,

                scale=
                    10,

                maxPixels=
                    100000

            )

            .getInfo()

        )


        if not result:

            return None


        # =================================================
        # IMAGE DATE
        # =================================================

        image_date = (

            image

            .date()

            .format(
                "YYYY-MM-dd"
            )

            .getInfo()

        )


        return {

            "NDVI":
                result.get("NDVI"),

            "EVI":
                result.get("EVI"),

            "NDMI":
                result.get("NDMI"),

            "NDWI":
                result.get("NDWI"),

            "image_date":
                image_date,

            "image_count":
                image_count

        }


    except Exception as e:

        print(
            "Earth Engine error:",
            e
        )

        return None


# =========================================================
# INTERCROP OPTIONS
# =========================================================

def get_intercrop_options(
    main_crop
):

    return (

        df[
            df["main_crop"] ==
            main_crop.lower()
        ]

        [

            [

                "interm_crop",

                "interm_land_cover",

                "land_sustainability"

            ]

        ]

        .drop_duplicates()

    )


# =========================================================
# YIELD MODEL
# =========================================================

def predict_crop_yield(

    crop,

    N,

    temperature,

    humidity,

    rainfall,

    area

):

    input_data = pd.DataFrame([{

        "crop":
            crop.lower(),

        "N":
            N,

        "temperature":
            temperature,

        "humidity":
            humidity,

        "rainfall":
            rainfall,

        "Area(hectares)":
            area

    }])


    prediction = (

        yield_model

        .predict(
            input_data
        )[0]

    )


    return max(
        0,
        float(prediction)
    )


# =========================================================
# YIELD CALCULATION
# =========================================================

def calculate_yield_values(

    main_yield,

    intercrop_yield,

    area,

    intercrop_land_cover

):

    # Main crop uses full field
    main_area = area


    # Intercrop uses specified percentage
    intercrop_area = (

        area

        *

        intercrop_land_cover

        /

        100

    )


    main_production = (

        main_yield

        *

        main_area

    )


    intercrop_production = (

        intercrop_yield

        *

        intercrop_area

    )


    combined_production = (

        main_production

        +

        intercrop_production

    )


    if main_production > 0:

        yield_percentage = (

            intercrop_production
            /
            main_production

        ) * 100

    else:

        yield_percentage = 0


    return {

        "main_area_hectares":
            round(
                main_area,
                2
            ),

        "intercrop_area_hectares":
            round(
                intercrop_area,
                2
            ),

        "main_production_t":
            round(
                main_production,
                2
            ),

        "intercrop_production_t":
            round(
                intercrop_production,
                2
            ),

        "combined_production_t":
            round(
                combined_production,
                2
            ),

        "intercrop_yield_contribution(%)":
            round(
                yield_percentage,
                2
            )

    }


# =========================================================
# TOP 3 RECOMMENDATIONS
# =========================================================

def recommend_top_3(

    N,

    temperature,

    humidity,

    ph,

    rainfall,

    area

):

    input_data = pd.DataFrame([{

        "N":
            N,

        "temperature":
            temperature,

        "humidity":
            humidity,

        "ph":
            ph,

        "rainfall":
            rainfall

    }])


    probabilities = (

        main_crop_model

        .predict_proba(
            input_data
        )[0]

    )


    crop_names = (
        main_crop_model.classes_
    )


    recommendations = []


    for i in range(
        len(crop_names)
    ):

        main_crop = (

            str(
                crop_names[i]
            )

            .strip()
            .lower()

        )


        crop_probability = (
            probabilities[i]
        )


        intercrops = (
            get_intercrop_options(
                main_crop
            )
        )


        if intercrops.empty:

            continue


        # =================================================
        # MAIN CROP YIELD
        # =================================================

        main_yield = predict_crop_yield(

            crop=main_crop,

            N=N,

            temperature=
                temperature,

            humidity=
                humidity,

            rainfall=
                rainfall,

            area=
                area

        )


        # =================================================
        # INTERCROPS
        # =================================================

        for _, row in intercrops.iterrows():

            interm_crop = (

                str(
                    row["interm_crop"]
                )

                .strip()
                .lower()

            )


            land_cover = float(

                row[
                    "interm_land_cover"
                ]

            )


            sustainability = float(

                row[
                    "land_sustainability"
                ]

            )


            # =================================================
            # INTERCROP YIELD
            # =================================================

            intercrop_yield = predict_crop_yield(

                crop=interm_crop,

                N=N,

                temperature=
                    temperature,

                humidity=
                    humidity,

                rainfall=
                    rainfall,

                area=
                    area

            )


            # =================================================
            # YIELD
            # =================================================

            yield_values = (

                calculate_yield_values(

                    main_yield=
                        main_yield,

                    intercrop_yield=
                        intercrop_yield,

                    area=
                        area,

                    intercrop_land_cover=
                        land_cover

                )

            )


            # =================================================
            # RECOMMENDATION SCORE
            # =================================================

            sustainability_score = (

                sustainability
                /
                100

            )


            final_score = (

                0.70 *
                crop_probability

                +

                0.30 *
                sustainability_score

            )


            recommendations.append({

                "main_crop":
                    main_crop,

                "interm_crop":
                    interm_crop,

                "interm_land_cover(%)":
                    round(
                        land_cover,
                        2
                    ),

                "land_sustainability(%)":
                    round(
                        sustainability,
                        2
                    ),

                "crop_probability(%)":
                    round(
                        crop_probability * 100,
                        2
                    ),

                "main_crop_yield(t/ha)":
                    round(
                        main_yield,
                        2
                    ),

                "interm_crop_yield(t/ha)":
                    round(
                        intercrop_yield,
                        2
                    ),

                "main_area(hectares)":
                    yield_values[
                        "main_area_hectares"
                    ],

                "intercrop_area(hectares)":
                    yield_values[
                        "intercrop_area_hectares"
                    ],

                "main_crop_production(t)":
                    yield_values[
                        "main_production_t"
                    ],

                "interm_crop_production(t)":
                    yield_values[
                        "intercrop_production_t"
                    ],

                "combined_production(t)":
                    yield_values[
                        "combined_production_t"
                    ],

                "yield_increase(%)":
                    yield_values[
                        "intercrop_yield_contribution(%)"
                    ],

                "recommendation_score":
                    round(
                        final_score * 100,
                        2
                    )

            })


    recommendations_df = pd.DataFrame(
        recommendations
    )


    if recommendations_df.empty:

        return recommendations_df


    recommendations_df = (

        recommendations_df

        .sort_values(

            by="recommendation_score",

            ascending=False

        )

        .head(3)

        .reset_index(drop=True)

    )


    return recommendations_df


# =========================================================
# API: CROP RECOMMENDATION
# =========================================================

@app.route(
    "/api/recommend",
    methods=["POST"]
)
def recommend():

    try:

        data = request.get_json()


        if not data:

            return jsonify({

                "success":
                    False,

                "error":
                    "Request body is empty."

            }), 400


        # =================================================
        # INPUT
        # =================================================

        latitude = float(
            data["latitude"]
        )

        longitude = float(
            data["longitude"]
        )

        area = float(
            data["area"]
        )


        # =================================================
        # VALIDATION
        # =================================================

        if area <= 0:

            return jsonify({

                "success":
                    False,

                "error":
                    "Area must be greater than 0."

            }), 400


        if not (
            -90 <= latitude <= 90
        ):

            return jsonify({

                "success":
                    False,

                "error":
                    "Invalid latitude."

            }), 400


        if not (
            -180 <= longitude <= 180
        ):

            return jsonify({

                "success":
                    False,

                "error":
                    "Invalid longitude."

            }), 400


        # =================================================
        # SOIL
        # =================================================

        soil = get_soil_data(

            latitude,

            longitude

        )


        # =================================================
        # WEATHER
        # =================================================

        weather = get_weather_data(

            latitude,

            longitude

        )


        # =================================================
        # SOIL UNAVAILABLE
        # =================================================

        if soil is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Soil data not available for this area.",

                "location": {

                    "latitude":
                        latitude,

                    "longitude":
                        longitude,

                    "area_hectares":
                        area

                },

                "soil": {

                    "available":
                        False,

                    "message":
                        "Soil data not available for this area."

                },

                "weather":
                    weather

            })


        # =================================================
        # WEATHER UNAVAILABLE
        # =================================================

        if not weather.get(
            "available",
            False
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "No valid weather data found in the last 7 days.",

                "location": {

                    "latitude":
                        latitude,

                    "longitude":
                        longitude,

                    "area_hectares":
                        area

                },

                "soil": {

                    "available":
                        True,

                    "data":
                        soil

                },

                "weather":
                    weather

            })


        # =================================================
        # MODEL INPUTS
        # =================================================

        N = soil.get(
            "nitrogen_g_per_kg"
        )


        ph = soil.get(
            "phh2o"
        )


        temperature = weather.get(
            "temperature_c"
        )


        humidity = weather.get(
            "humidity_percent"
        )


        rainfall = weather.get(
            "rainfall_mm"
        )


        # =================================================
        # VALIDATION
        # =================================================

        missing = []


        if N is None:
            missing.append("nitrogen")


        if ph is None:
            missing.append("pH")


        if temperature is None:
            missing.append("temperature")


        if humidity is None:
            missing.append("humidity")


        if rainfall is None:
            missing.append("rainfall")


        if missing:

            return jsonify({

                "success":
                    False,

                "message":
                    "Required model inputs are unavailable.",

                "missing":
                    missing,

                "soil":
                    soil,

                "weather":
                    weather

            })


        # =================================================
        # RECOMMENDATION
        # =================================================

        result = recommend_top_3(

            N=float(N),

            temperature=float(
                temperature
            ),

            humidity=float(
                humidity
            ),

            ph=float(ph),

            rainfall=float(
                rainfall
            ),

            area=float(area)

        )


        # =================================================
        # RESPONSE
        # =================================================

        return jsonify({

            "success":
                True,

            "location": {

                "latitude":
                    latitude,

                "longitude":
                    longitude,

                "area_hectares":
                    area

            },

            "soil": {

                "available":
                    True,

                "data":
                    soil

            },

            "weather": {

                "available":
                    True,

                "data":
                    weather

            },

            "model_inputs": {

                "N_g_per_kg":
                    round(
                        float(N),
                        4
                    ),

                "pH":
                    round(
                        float(ph),
                        2
                    ),

                "temperature_C":
                    round(
                        float(temperature),
                        2
                    ),

                "humidity_percent":
                    round(
                        float(humidity),
                        2
                    ),

                "rainfall_mm":
                    round(
                        float(rainfall),
                        2
                    ),

                "area_hectares":
                    round(
                        float(area),
                        2
                    )

            },

            "recommendations":
                result.to_dict(
                    orient="records"
                )

        })


    except KeyError as e:

        return jsonify({

            "success":
                False,

            "error":
                f"Missing field: {str(e)}"

        }), 400


    except ValueError as e:

        return jsonify({

            "success":
                False,

            "error":
                f"Invalid value: {str(e)}"

        }), 400


    except Exception as e:

        print(
            "Recommendation API error:",
            e
        )

        return jsonify({

            "success":
                False,

            "error":
                str(e)

        }), 500


# =========================================================
# API: GEOSPATIAL DATA
# =========================================================

@app.route(
    "/api/geospatialData",
    methods=["POST"]
)
def geospatial_data():

    try:

        data = request.get_json()


        if not data:

            return jsonify({

                "success":
                    False,

                "error":
                    "Request body is empty."

            }), 400


        # =================================================
        # LOCATION
        # =================================================

        latitude = float(
            data["latitude"]
        )

        longitude = float(
            data["longitude"]
        )


        # =================================================
        # VALIDATION
        # =================================================

        if not (
            -90 <= latitude <= 90
        ):

            return jsonify({

                "success":
                    False,

                "error":
                    "Invalid latitude."

            }), 400


        if not (
            -180 <= longitude <= 180
        ):

            return jsonify({

                "success":
                    False,

                "error":
                    "Invalid longitude."

            }), 400


        # =================================================
        # DATE RANGE
        # =================================================

        today = datetime.now(
            ZoneInfo("Asia/Kolkata")
        ).date()


        start_date = (
            today.replace(
                year=today.year - 2
            )
        ).strftime(
            "%Y-%m-%d"
        )

        end_date = today.strftime(
            "%Y-%m-%d"
        )


        # =================================================
        # SENTINEL INDICES
        # =================================================

        result = get_indices(

            latitude,

            longitude,

            start_date,

            end_date

        )


        # =================================================
        # NO DATA
        # =================================================

        if result is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "No suitable Sentinel-2 data available for this area.",

                "location": {

                    "latitude":
                        latitude,

                    "longitude":
                        longitude

                },

                "search_period": {

                    "start":
                        start_date,

                    "end":
                        end_date

                },

                "geospatial": {

                    "available":
                        False

                }

            })


        # =================================================
        # RESPONSE
        # =================================================

        return jsonify({

            "success":
                True,

            "location": {

                "latitude":
                    latitude,

                "longitude":
                    longitude

            },

            "search_period": {

                "start":
                    start_date,

                "end":
                    end_date

            },

            "geospatial": {

                "available":
                    True,

                "NDVI":
                    result.get(
                        "NDVI"
                    ),

                "EVI":
                    result.get(
                        "EVI"
                    ),

                "NDMI":
                    result.get(
                        "NDMI"
                    ),

                "NDWI":
                    result.get(
                        "NDWI"
                    ),

                "image_date":
                    result.get(
                        "image_date"
                    ),

                "image_count":
                    result.get(
                        "image_count"
                    )

            }

        })


    except KeyError as e:

        return jsonify({

            "success":
                False,

            "error":
                f"Missing field: {str(e)}"

        }), 400


    except ValueError as e:

        return jsonify({

            "success":
                False,

            "error":
                f"Invalid value: {str(e)}"

        }), 400


    except Exception as e:

        print(
            "Geospatial API error:",
            e
        )

        return jsonify({

            "success":
                False,

            "error":
                str(e)

        }), 500


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/")
def home():

    return jsonify({

        "message":
            "Crop Recommendation API is running",

        "status":
            "OK",

        "endpoints": [

            "/api/recommend",

            "/api/geospatialData"

        ]

    })


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=True

    )