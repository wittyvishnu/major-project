# Crop Recommendation and Yield Prediction System

A smart agriculture project that recommends suitable crops and estimates yield using soil, weather, and geospatial data. The application is built with Python and Flask and exposes REST API endpoints for crop recommendation and location-based geospatial analysis.

## Features

- Crop recommendation based on soil and weather conditions
- Yield prediction for selected crops
- Intercrop recommendations with land sustainability data
- Geospatial vegetation and moisture indices using Sentinel-2 data
- Soil data retrieval from SoilGrids
- Weather data retrieval from NASA POWER API
- Google Earth Engine integration for remote sensing analysis

## Tech Stack

- Python
- Flask
- Pandas
- NumPy
- Scikit-learn
- Joblib
- Requests
- Google Earth Engine API

## Project Structure

```bash
crop_recommedation & yeild/
├── app.py
├── Crop_recommendation_with_intercrops.csv
├── Crop_yeild.csv
├── requirements.txt
├── .gitignore
└── README.md
```

## Requirements

Install the dependencies:

```bash
pip install -r requirements.txt
```

## Setup

1. Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

2. Install the packages:

```bash
pip install -r requirements.txt
```

3. Run the Flask application:

```bash
python app.py
```

The app will run on:

```bash
http://localhost:5000
```

## API Endpoints

### 1. Home

```http
GET /
```

Returns a basic status message and available endpoints.

### 2. Crop Recommendation

```http
POST /api/recommend
```

Request body example:

```json
{
  "latitude": 17.3850,
  "longitude": 78.4867,
  "area": 10
}
```

Response includes:

- soil data
- weather data
- model inputs
- top crop recommendations
- estimated production and yield increase

### 3. Geospatial Data

```http
POST /api/geospatialData
```

Request body example:

```json
{
  "latitude": 17.3850,
  "longitude": 78.4867
}
```

Response includes:

- NDVI
- EVI
- NDMI
- NDWI
- image date
- image count

## Data Sources

- SoilGrids for soil properties
- NASA POWER for weather data
- Sentinel-2 satellite imagery via Google Earth Engine

## Notes

- Google Earth Engine may require authentication before use.
- If the project uses a local environment, make sure the required model files are available in the project folder.
- Some APIs depend on internet access for live data retrieval.

## Use Case

This project is useful for agricultural planning, helping farmers and agronomists decide which crops to grow based on local soil and climate conditions while also estimating expected productivity.

## Future Improvements

- Add dashboard frontend for visualization
- Improve model accuracy with larger datasets
- Add user authentication
- Deploy on cloud hosting
- Provide CSV export for recommendations
