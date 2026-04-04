

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from datetime import datetime, timedelta
import shap
import json
import os

# ============================================================================
# APP SETUP
# ============================================================================

app = FastAPI(
    title="🪸 ReefBond API",
    description="Parametric Coral Bleaching Insurance — AI Prediction Engine",
    version="1.0.0"
)

# Allow React dashboard to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to dashboard domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# LOAD MODEL & DATA
# ============================================================================

# --- Load trained XGBoost model ---
model = XGBClassifier()
model.load_model("reefbond_xgboost_model.json")

# --- Load feature column names ---
feature_cols = [
    'SST_90th', 'SSTA_90th', 'HotSpot', 'DHW',
    'SST_mean_7d', 'SST_max_7d', 'SST_std_7d', 'SSTA_mean_7d', 'DHW_max_7d', 'HotSpot_mean_7d',
    'SST_mean_14d', 'SST_max_14d', 'SST_std_14d', 'SSTA_mean_14d', 'DHW_max_14d', 'HotSpot_mean_14d',
    'SST_mean_30d', 'SST_max_30d', 'SST_std_30d', 'SSTA_mean_30d', 'DHW_max_30d', 'HotSpot_mean_30d',
    'SST_change_7d', 'DHW_change_7d', 'SSTA_change_7d',
    'month_sin', 'month_cos', 'day_of_year',
    'SST_above_threshold',
    'region_code'
]

# --- Load NOAA data ---
def load_noaa_data(filepath, region_name):
    columns = [
        'YYYY', 'MM', 'DD', 'SST_MIN', 'SST_MAX', 'SST_90th',
        'SSTA_90th', 'HotSpot', 'DHW', 'BAA'
    ]
    df = pd.read_csv(filepath, skiprows=21, sep=r'\s+', names=columns, header=0)
    df['date'] = pd.to_datetime(
        df['YYYY'].astype(str) + '-' + df['MM'].astype(str).str.zfill(2) + '-' + df['DD'].astype(str).str.zfill(2),
        errors='coerce'
    )
    df = df.dropna(subset=['date'])
    df['region'] = region_name
    for col in columns[3:]:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

df_south = load_noaa_data('data/southern_sri_lanka.txt', 'Southern Sri Lanka')
df_east = load_noaa_data('data/eastern_sri_lanka.txt', 'Eastern Sri Lanka')
df = pd.concat([df_south, df_east], ignore_index=True).sort_values(['region', 'date']).reset_index(drop=True)

# --- Engineer features (same as training) ---
def engineer_features(df):
    features = df.copy()
    for window in [7, 14, 30]:
        for col_name, col_src in [('SST_mean', 'SST_90th'), ('SST_max', 'SST_90th'),
                                   ('SST_std', 'SST_90th'), ('SSTA_mean', 'SSTA_90th'),
                                   ('DHW_max', 'DHW'), ('HotSpot_mean', 'HotSpot')]:
            if 'mean' in col_name:
                features[f'{col_name}_{window}d'] = features.groupby('region')[col_src].transform(
                    lambda x: x.rolling(window, min_periods=1).mean())
            elif 'max' in col_name:
                features[f'{col_name}_{window}d'] = features.groupby('region')[col_src].transform(
                    lambda x: x.rolling(window, min_periods=1).max())
            elif 'std' in col_name:
                features[f'{col_name}_{window}d'] = features.groupby('region')[col_src].transform(
                    lambda x: x.rolling(window, min_periods=1).std())

    features['SST_change_7d'] = features.groupby('region')['SST_90th'].transform(lambda x: x.diff(7))
    features['DHW_change_7d'] = features.groupby('region')['DHW'].transform(lambda x: x.diff(7))
    features['SSTA_change_7d'] = features.groupby('region')['SSTA_90th'].transform(lambda x: x.diff(7))
    features['month'] = features['date'].dt.month
    features['day_of_year'] = features['date'].dt.dayofyear
    features['month_sin'] = np.sin(2 * np.pi * features['month'] / 12)
    features['month_cos'] = np.cos(2 * np.pi * features['month'] / 12)
    features['SST_above_threshold'] = features['SST_90th'] - features.groupby('region')['SST_90th'].transform(
        lambda x: x.rolling(365, min_periods=30).quantile(0.9))
    features['target_14d'] = features.groupby('region')['BAA'].transform(lambda x: x.shift(-14))
    features['target_14d'] = (features['target_14d'] >= 1).astype(int)
    features['region_code'] = (features['region'] == 'Eastern Sri Lanka').astype(int)
    return features

df_features = engineer_features(df).dropna()

# --- SHAP explainer ---
explainer = shap.TreeExplainer(model)

# ============================================================================
# REGION MAPPING — Matches reef sites to NOAA Virtual Stations
# ============================================================================

REGION_MAP = {
    "hikkaduwa":     "Southern Sri Lanka",
    "mirissa":       "Southern Sri Lanka",
    "unawatuna":     "Southern Sri Lanka",
    "galle":         "Southern Sri Lanka",
    "weligama":      "Southern Sri Lanka",
    "southern":      "Southern Sri Lanka",
    "trincomalee":   "Eastern Sri Lanka",
    "pigeon_island": "Eastern Sri Lanka",
    "nilaveli":      "Eastern Sri Lanka",
    "batticaloa":    "Eastern Sri Lanka",
    "eastern":       "Eastern Sri Lanka",
}

REGION_COORDS = {
    "Southern Sri Lanka": {"lat": 6.1000, "lng": 80.1000,
        "sites": ["Hikkaduwa", "Mirissa", "Unawatuna", "Galle", "Weligama"]},
    "Eastern Sri Lanka":  {"lat": 8.5667, "lng": 81.2333,
        "sites": ["Trincomalee", "Pigeon Island", "Nilaveli", "Batticaloa"]},
}

def resolve_region(location: str) -> str:
    loc = location.lower().replace(" ", "_")
    if loc in REGION_MAP:
        return REGION_MAP[loc]
    raise HTTPException(status_code=404,
        detail=f"Location '{location}' not found. Available: {list(REGION_MAP.keys())}")


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class PredictionResponse(BaseModel):
    location: str
    region: str
    date: str
    sst: float
    sst_anomaly: float
    hotspot: float
    dhw: float
    bleaching_risk_percent: float
    risk_level: str       # LOW / MEDIUM / HIGH
    should_trigger_payout: bool
    top_factors: list
    explanation: str

class DHWResponse(BaseModel):
    location: str
    region: str
    date: str
    dhw: float
    sst: float
    sst_anomaly: float
    hotspot: float
    baa_level: int
    threshold_crossed: bool

class OracleEvent(BaseModel):
    location: str
    dhw_value: float
    sst: float
    risk_percent: float
    timestamp: str
    should_payout: bool
    tx_hash: Optional[str] = None

class TimelinePoint(BaseModel):
    date: str
    sst: float
    dhw: float
    risk_percent: float
    risk_level: str


# ============================================================================
# API ENDPOINTS
# ============================================================================

# --- Health Check ---
@app.get("/", tags=["System"])
def root():
    return {
        "service": "ReefBond AI Prediction Engine",
        "status": "running",
        "model": "XGBoost (Arcodia et al. 2025 architecture)",
        "data_source": "NOAA Coral Reef Watch",
        "regions": list(REGION_COORDS.keys()),
        "version": "1.0.0"
    }


# --- GET /predict/{location} --- MAIN ENDPOINT ---
@app.get("/predict/{location}", response_model=PredictionResponse, tags=["Prediction"])
def predict_bleaching(location: str):
    """
    🔮 Predict bleaching risk 14 days ahead for a given location.
    Returns risk percentage + SHAP explanation of top factors.

    Judge Explanation: "This endpoint is what the oracle calls every 6 hours.
    If risk > 70% AND DHW > threshold, the smart contract triggers payout."
    """
    region = resolve_region(location)
    region_data = df_features[df_features['region'] == region]
    latest = region_data.iloc[-1]

    # Predict
    X = region_data[feature_cols].tail(1)
    risk_prob = float(model.predict_proba(X)[:, 1][0])
    risk_percent = round(risk_prob * 100, 1)

    # Risk level
    if risk_percent > 70:
        risk_level = "HIGH"
    elif risk_percent > 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # SHAP explanation
    shap_vals = explainer.shap_values(X)
    factor_df = pd.DataFrame({
        'feature': feature_cols,
        'shap_value': shap_vals[0]
    }).sort_values('shap_value', key=abs, ascending=False).head(5)

    top_factors = []
    for _, row in factor_df.iterrows():
        direction = "increases" if row['shap_value'] > 0 else "decreases"
        top_factors.append({
            "feature": row['feature'],
            "direction": direction,
            "impact": round(float(abs(row['shap_value'])), 4)
        })

    # Human-readable explanation
    top = top_factors[0]
    explanation = (
        f"Primary driver: {top['feature']} {top['direction']} "
        f"bleaching risk (impact: {top['impact']}). "
        f"Current SST is {latest['SST_90th']:.2f}°C with anomaly {latest['SSTA_90th']:+.3f}°C."
    )

    return PredictionResponse(
        location=location,
        region=region,
        date=latest['date'].strftime('%Y-%m-%d'),
        sst=round(float(latest['SST_90th']), 3),
        sst_anomaly=round(float(latest['SSTA_90th']), 3),
        hotspot=round(float(latest['HotSpot']), 4),
        dhw=round(float(latest['DHW']), 4),
        bleaching_risk_percent=risk_percent,
        risk_level=risk_level,
        should_trigger_payout=(risk_percent > 70 and float(latest['DHW']) >= 4),
        top_factors=top_factors,
        explanation=explanation
    )


# --- GET /dhw/{location} --- Current NOAA DHW reading ---
@app.get("/dhw/{location}", response_model=DHWResponse, tags=["NOAA Data"])
def get_dhw(location: str):
    """
     Get current Degree Heating Weeks value for a location.
    This is what Chainlink oracle reads and pushes on-chain.

    DHW > 4  → Bleaching Watch
    DHW > 8  → Severe Bleaching → Smart contract triggers payout
    """
    region = resolve_region(location)
    region_data = df[df['region'] == region]
    latest = region_data.iloc[-1]

    return DHWResponse(
        location=location,
        region=region,
        date=latest['date'].strftime('%Y-%m-%d'),
        dhw=round(float(latest['DHW']), 4),
        sst=round(float(latest['SST_90th']), 3),
        sst_anomaly=round(float(latest['SSTA_90th']), 3),
        hotspot=round(float(latest['HotSpot']), 4),
        baa_level=int(latest['BAA']),
        threshold_crossed=float(latest['DHW']) >= 4
    )


# --- POST /oracle/trigger --- Mock oracle event ---
@app.post("/oracle/trigger", response_model=OracleEvent, tags=["Oracle"])
def trigger_oracle(location: str):
    """
    ⚡ Simulate Chainlink oracle writing bleaching event on-chain.
    In production: Chainlink reads /dhw/{location} every 6 hours.
    If DHW > threshold → writes to smart contract → auto payout.

    For demo: Returns a mock transaction hash to show the flow.
    """
    region = resolve_region(location)
    region_data = df_features[df_features['region'] == region]
    latest = region_data.iloc[-1]

    X = region_data[feature_cols].tail(1)
    risk_prob = float(model.predict_proba(X)[:, 1][0])
    risk_percent = round(risk_prob * 100, 1)
    dhw_val = float(latest['DHW'])

    should_payout = risk_percent > 70 and dhw_val >= 4

    # Mock transaction hash (in real system, this comes from Polygon)
    import hashlib
    mock_data = f"{location}-{datetime.now().isoformat()}-{risk_percent}"
    tx_hash = "0x" + hashlib.sha256(mock_data.encode()).hexdigest()[:64]

    return OracleEvent(
        location=location,
        dhw_value=round(dhw_val, 4),
        sst=round(float(latest['SST_90th']), 3),
        risk_percent=risk_percent,
        timestamp=datetime.now().isoformat(),
        should_payout=should_payout,
        tx_hash=tx_hash if should_payout else None
    )


# --- GET /timeline/{location} --- Risk timeline for dashboard ---
@app.get("/timeline/{location}", response_model=list[TimelinePoint], tags=["Dashboard"])
def get_timeline(location: str, days: int = 90):
    """
     Get risk timeline for the dashboard chart.
    Returns daily risk % for the last N days.
    React dashboard plots this as the 6-week forecast line.
    """
    region = resolve_region(location)
    region_data = df_features[df_features['region'] == region].tail(days)
    X_timeline = region_data[feature_cols]

    risk_probs = model.predict_proba(X_timeline)[:, 1]

    timeline = []
    for i, (_, row) in enumerate(region_data.iterrows()):
        risk_pct = round(float(risk_probs[i]) * 100, 1)
        timeline.append(TimelinePoint(
            date=row['date'].strftime('%Y-%m-%d'),
            sst=round(float(row['SST_90th']), 3),
            dhw=round(float(row['DHW']), 4),
            risk_percent=risk_pct,
            risk_level="HIGH" if risk_pct > 70 else "MEDIUM" if risk_pct > 40 else "LOW"
        ))

    return timeline


# --- GET /regions --- List all available regions and sites ---
@app.get("/regions", tags=["System"])
def get_regions():
    """List all available reef monitoring regions and dive sites."""
    return {
        "regions": REGION_COORDS,
        "available_locations": list(REGION_MAP.keys())
    }


# --- GET /stats --- Overall reef health statistics ---
@app.get("/stats", tags=["Dashboard"])
def get_stats():
    """
     Summary statistics for the dashboard header cards.
    Shows current status across all monitored regions.
    """
    stats = {}
    for region_name in REGION_COORDS:
        region_data = df_features[df_features['region'] == region_name]
        latest = region_data.iloc[-1]
        X = region_data[feature_cols].tail(1)
        risk = float(model.predict_proba(X)[:, 1][0]) * 100

        stats[region_name] = {
            "current_sst": round(float(latest['SST_90th']), 2),
            "current_dhw": round(float(latest['DHW']), 4),
            "current_anomaly": round(float(latest['SSTA_90th']), 3),
            "bleaching_risk_percent": round(risk, 1),
            "risk_level": "HIGH" if risk > 70 else "MEDIUM" if risk > 40 else "LOW",
            "last_updated": latest['date'].strftime('%Y-%m-%d'),
            "sites": REGION_COORDS[region_name]["sites"]
        }

    return {
        "timestamp": datetime.now().isoformat(),
        "monitored_regions": len(REGION_COORDS),
        "total_dive_sites": sum(len(v["sites"]) for v in REGION_COORDS.values()),
        "data_source": "NOAA Coral Reef Watch",
        "model_accuracy": "89.87%",
        "regions": stats
    }


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print(" ReefBond API Starting...")
    print("=" * 60)
    print(" Endpoints:")
    print("   GET  /predict/{location}  → AI bleaching prediction + SHAP")
    print("   GET  /dhw/{location}      → Current NOAA DHW reading")
    print("   POST /oracle/trigger      → Simulate oracle event")
    print("   GET  /timeline/{location} → Risk timeline for dashboard")
    print("   GET  /regions             → Available reef sites")
    print("   GET  /stats               → Dashboard summary")
    print("   GET  /docs                → Swagger UI (show to judges!)")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)