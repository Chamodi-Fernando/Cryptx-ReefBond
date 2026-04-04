from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from datetime import datetime
import shap
import sqlite3
import hashlib

app = FastAPI(title="ReefBond API", description="Parametric Coral Bleaching Insurance", version="2.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ============================================================================
# DATABASE
# ============================================================================

def init_db():
    conn = sqlite3.connect('reefbond.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS operators (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, location TEXT NOT NULL,
        wallet_address TEXT DEFAULT '', premium_paid REAL DEFAULT 0.01,
        total_payouts REAL DEFAULT 0, is_active INTEGER DEFAULT 1,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS payout_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, operator_id INTEGER, operator_name TEXT,
        location TEXT NOT NULL, dhw_value REAL, sst_value REAL, risk_percent REAL,
        payout_amount REAL, tx_hash TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operator_id) REFERENCES operators(id))''')

    # Backfill missing columns for older DB files created before schema updates.
    def ensure_column(table, column, definition):
        cols = [row[1] for row in c.execute(f"PRAGMA table_info({table})").fetchall()]
        if column not in cols:
            c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

    ensure_column('operators', 'wallet_address', "TEXT DEFAULT ''")
    ensure_column('operators', 'premium_paid', 'REAL DEFAULT 0.01')
    ensure_column('operators', 'total_payouts', 'REAL DEFAULT 0')
    ensure_column('operators', 'is_active', 'INTEGER DEFAULT 1')

    ensure_column('payout_events', 'operator_name', 'TEXT')
    ensure_column('payout_events', 'sst_value', 'REAL')
    ensure_column('payout_events', 'risk_percent', 'REAL')

    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect('reefbond.db')
    conn.row_factory = sqlite3.Row
    return conn

# ============================================================================
# LOAD MODEL & DATA
# ============================================================================

model = XGBClassifier()
model.load_model("reefbond_xgboost_model.json")

feature_cols = [
    'SST_90th','SSTA_90th','HotSpot','DHW',
    'SST_mean_7d','SST_max_7d','SST_std_7d','SSTA_mean_7d','DHW_max_7d','HotSpot_mean_7d',
    'SST_mean_14d','SST_max_14d','SST_std_14d','SSTA_mean_14d','DHW_max_14d','HotSpot_mean_14d',
    'SST_mean_30d','SST_max_30d','SST_std_30d','SSTA_mean_30d','DHW_max_30d','HotSpot_mean_30d',
    'SST_change_7d','DHW_change_7d','SSTA_change_7d','month_sin','month_cos','day_of_year',
    'SST_above_threshold','region_code']

def load_noaa_data(filepath, region_name):
    columns = ['YYYY','MM','DD','SST_MIN','SST_MAX','SST_90th','SSTA_90th','HotSpot','DHW','BAA']
    df = pd.read_csv(filepath, skiprows=21, sep=r'\s+', names=columns, header=0)
    df['date'] = pd.to_datetime(df['YYYY'].astype(str)+'-'+df['MM'].astype(str).str.zfill(2)+'-'+df['DD'].astype(str).str.zfill(2), errors='coerce')
    df = df.dropna(subset=['date'])
    df['region'] = region_name
    for col in columns[3:]: df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

df_south = load_noaa_data('data/southern_sri_lanka.txt', 'Southern Sri Lanka')
df_east = load_noaa_data('data/eastern_sri_lanka.txt', 'Eastern Sri Lanka')
df = pd.concat([df_south, df_east], ignore_index=True).sort_values(['region','date']).reset_index(drop=True)

def engineer_features(df):
    features = df.copy()
    for window in [7, 14, 30]:
        for cn, cs in [('SST_mean','SST_90th'),('SST_max','SST_90th'),('SST_std','SST_90th'),('SSTA_mean','SSTA_90th'),('DHW_max','DHW'),('HotSpot_mean','HotSpot')]:
            if 'mean' in cn: features[f'{cn}_{window}d'] = features.groupby('region')[cs].transform(lambda x: x.rolling(window, min_periods=1).mean())
            elif 'max' in cn: features[f'{cn}_{window}d'] = features.groupby('region')[cs].transform(lambda x: x.rolling(window, min_periods=1).max())
            elif 'std' in cn: features[f'{cn}_{window}d'] = features.groupby('region')[cs].transform(lambda x: x.rolling(window, min_periods=1).std())
    features['SST_change_7d'] = features.groupby('region')['SST_90th'].transform(lambda x: x.diff(7))
    features['DHW_change_7d'] = features.groupby('region')['DHW'].transform(lambda x: x.diff(7))
    features['SSTA_change_7d'] = features.groupby('region')['SSTA_90th'].transform(lambda x: x.diff(7))
    features['month'] = features['date'].dt.month
    features['day_of_year'] = features['date'].dt.dayofyear
    features['month_sin'] = np.sin(2*np.pi*features['month']/12)
    features['month_cos'] = np.cos(2*np.pi*features['month']/12)
    features['SST_above_threshold'] = features['SST_90th'] - features.groupby('region')['SST_90th'].transform(lambda x: x.rolling(365, min_periods=30).quantile(0.9))
    features['target_14d'] = features.groupby('region')['BAA'].transform(lambda x: x.shift(-14))
    features['target_14d'] = (features['target_14d'] >= 1).astype(int)
    features['region_code'] = (features['region'] == 'Eastern Sri Lanka').astype(int)
    return features

df_features = engineer_features(df).dropna()
explainer = shap.TreeExplainer(model)

REGION_MAP = {"hikkaduwa":"Southern Sri Lanka","mirissa":"Southern Sri Lanka","unawatuna":"Southern Sri Lanka","galle":"Southern Sri Lanka","weligama":"Southern Sri Lanka","southern":"Southern Sri Lanka","trincomalee":"Eastern Sri Lanka","pigeon_island":"Eastern Sri Lanka","nilaveli":"Eastern Sri Lanka","batticaloa":"Eastern Sri Lanka","eastern":"Eastern Sri Lanka"}
REGION_COORDS = {"Southern Sri Lanka":{"lat":6.1,"lng":80.1,"sites":["Hikkaduwa","Mirissa","Unawatuna","Galle","Weligama"]},"Eastern Sri Lanka":{"lat":8.57,"lng":81.23,"sites":["Trincomalee","Pigeon Island","Nilaveli","Batticaloa"]}}
REGISTRATION_PREMIUM_ETH = 0.01

def normalize_location_key(location: str) -> str:
    return location.strip().lower().replace("-", "_").replace(" ", "_")

def resolve_region(location):
    loc = normalize_location_key(location)
    if loc in REGION_MAP: return REGION_MAP[loc]
    raise HTTPException(status_code=404, detail=f"Location '{location}' not found")

# ============================================================================
# MODELS
# ============================================================================

class PredictionResponse(BaseModel):
    location: str; region: str; date: str; sst: float; sst_anomaly: float; hotspot: float; dhw: float
    bleaching_risk_percent: float; risk_level: str; should_trigger_payout: bool; top_factors: list; explanation: str

class DHWResponse(BaseModel):
    location: str; region: str; date: str; dhw: float; sst: float; sst_anomaly: float; hotspot: float; baa_level: int; threshold_crossed: bool

class OracleEvent(BaseModel):
    location: str; dhw_value: float; sst: float; risk_percent: float; timestamp: str; should_payout: bool; tx_hash: Optional[str] = None

class TimelinePoint(BaseModel):
    date: str; sst: float; dhw: float; risk_percent: float; risk_level: str

class OperatorCreate(BaseModel):
    name: str
    location: str
    wallet_address: str = ""

class PayoutRequest(BaseModel):
    location: str
    dhw_value: float = 8.23
    sst_value: float = 30.32
    risk_percent: float = 99.0

# ============================================================================
# SYSTEM
# ============================================================================

@app.get("/", tags=["System"])
def root():
    return {"service": "ReefBond API", "status": "running", "version": "2.0.0"}

@app.get("/regions", tags=["System"])
def get_regions():
    return {"regions": REGION_COORDS, "available_locations": list(REGION_MAP.keys())}

@app.get("/stats", tags=["Dashboard"])
def get_stats():
    stats = {}
    for rn in REGION_COORDS:
        rd = df_features[df_features['region']==rn]; latest = rd.iloc[-1]
        X = rd[feature_cols].tail(1); risk = float(model.predict_proba(X)[:,1][0])*100
        stats[rn] = {"current_sst":round(float(latest['SST_90th']),2),"current_dhw":round(float(latest['DHW']),4),
            "current_anomaly":round(float(latest['SSTA_90th']),3),"bleaching_risk_percent":round(risk,1),
            "risk_level":"HIGH" if risk>70 else "MEDIUM" if risk>40 else "LOW",
            "last_updated":latest['date'].strftime('%Y-%m-%d'),"sites":REGION_COORDS[rn]["sites"]}
    conn = get_db()
    op_count = conn.execute("SELECT COUNT(*) FROM operators").fetchone()[0]
    ev_count = conn.execute("SELECT COUNT(*) FROM payout_events").fetchone()[0]
    conn.close()
    return {"timestamp":datetime.now().isoformat(),"monitored_regions":len(REGION_COORDS),
        "total_operators":op_count,"total_events":ev_count,"model_accuracy":"89.87%","regions":stats}

# ============================================================================
# PREDICTION
# ============================================================================

@app.get("/predict/{location}", response_model=PredictionResponse, tags=["Prediction"])
def predict_bleaching(location: str):
    region = resolve_region(location)
    rd = df_features[df_features['region']==region]; latest = rd.iloc[-1]
    X = rd[feature_cols].tail(1); rp = float(model.predict_proba(X)[:,1][0]); rpct = round(rp*100,1)
    rl = "HIGH" if rpct>70 else "MEDIUM" if rpct>40 else "LOW"
    sv = explainer.shap_values(X)
    fdf = pd.DataFrame({'feature':feature_cols,'shap_value':sv[0]}).sort_values('shap_value',key=abs,ascending=False).head(5)
    tf = [{"feature":r['feature'],"direction":"increases" if r['shap_value']>0 else "decreases","impact":round(float(abs(r['shap_value'])),4)} for _,r in fdf.iterrows()]
    t = tf[0]; exp = f"Primary driver: {t['feature']} {t['direction']} bleaching risk. SST is {latest['SST_90th']:.2f}C, anomaly {latest['SSTA_90th']:+.3f}C."
    return PredictionResponse(location=location,region=region,date=latest['date'].strftime('%Y-%m-%d'),
        sst=round(float(latest['SST_90th']),3),sst_anomaly=round(float(latest['SSTA_90th']),3),
        hotspot=round(float(latest['HotSpot']),4),dhw=round(float(latest['DHW']),4),
        bleaching_risk_percent=rpct,risk_level=rl,should_trigger_payout=(rpct>70 and float(latest['DHW'])>=4),
        top_factors=tf,explanation=exp)

@app.get("/dhw/{location}", response_model=DHWResponse, tags=["NOAA Data"])
def get_dhw(location: str):
    region = resolve_region(location); rd = df[df['region']==region]; latest = rd.iloc[-1]
    return DHWResponse(location=location,region=region,date=latest['date'].strftime('%Y-%m-%d'),
        dhw=round(float(latest['DHW']),4),sst=round(float(latest['SST_90th']),3),
        sst_anomaly=round(float(latest['SSTA_90th']),3),hotspot=round(float(latest['HotSpot']),4),
        baa_level=int(latest['BAA']),threshold_crossed=float(latest['DHW'])>=4)

@app.post("/oracle/trigger", response_model=OracleEvent, tags=["Oracle"])
def trigger_oracle(location: str):
    region = resolve_region(location); rd = df_features[df_features['region']==region]; latest = rd.iloc[-1]
    X = rd[feature_cols].tail(1); rp = float(model.predict_proba(X)[:,1][0]); rpct = round(rp*100,1)
    dv = float(latest['DHW']); sp = rpct>70 and dv>=4
    tx = "0x"+hashlib.sha256(f"{location}-{datetime.now().isoformat()}".encode()).hexdigest()[:64]
    return OracleEvent(location=location,dhw_value=round(dv,4),sst=round(float(latest['SST_90th']),3),
        risk_percent=rpct,timestamp=datetime.now().isoformat(),should_payout=sp,tx_hash=tx if sp else None)

@app.get("/timeline/{location}", response_model=list[TimelinePoint], tags=["Dashboard"])
def get_timeline(location: str, days: int = 90):
    region = resolve_region(location); rd = df_features[df_features['region']==region].tail(days)
    X = rd[feature_cols]; rps = model.predict_proba(X)[:,1]
    return [TimelinePoint(date=row['date'].strftime('%Y-%m-%d'),sst=round(float(row['SST_90th']),3),
        dhw=round(float(row['DHW']),4),risk_percent=round(float(rps[i])*100,1),
        risk_level="HIGH" if float(rps[i])*100>70 else "MEDIUM" if float(rps[i])*100>40 else "LOW")
        for i,(_,row) in enumerate(rd.iterrows())]

# ============================================================================
# OPERATORS (Database)
# ============================================================================

@app.post("/operators/register", tags=["Operators"])
def register_operator(op: OperatorCreate):
    normalized_location = normalize_location_key(op.location)
    if normalized_location not in REGION_MAP:
        raise HTTPException(status_code=400, detail=f"Unsupported location '{op.location}'")

    conn = get_db(); c = conn.cursor()
    c.execute(
        "INSERT INTO operators (name,location,wallet_address,premium_paid) VALUES (?,?,?,?)",
        (op.name, normalized_location, op.wallet_address, REGISTRATION_PREMIUM_ETH)
    )
    conn.commit(); op_id = c.lastrowid; conn.close()
    return {
        "id": op_id,
        "name": op.name,
        "location": normalized_location,
        "premium_paid": REGISTRATION_PREMIUM_ETH,
        "status": "registered"
    }

@app.get("/operators", tags=["Operators"])
def get_all_operators():
    conn = get_db()
    ops = conn.execute("SELECT * FROM operators ORDER BY registered_at DESC").fetchall()
    conn.close()
    return [dict(o) for o in ops]

@app.get("/operators/{op_id}", tags=["Operators"])
def get_operator_by_id(op_id: int):
    conn = get_db(); op = conn.execute("SELECT * FROM operators WHERE id=?",(op_id,)).fetchone(); conn.close()
    if not op: raise HTTPException(status_code=404, detail="Operator not found")
    return dict(op)

@app.delete("/operators/{op_id}", tags=["Operators"])
def delete_operator(op_id: int):
    conn = get_db(); conn.execute("DELETE FROM operators WHERE id=?",(op_id,)); conn.commit(); conn.close()
    return {"deleted":op_id}

@app.post("/operators/payout", tags=["Operators"])
def record_payout(event: PayoutRequest):
    normalized_location = normalize_location_key(event.location)

    conn = get_db(); c = conn.cursor()
    ops = c.execute(
        """
        SELECT * FROM operators
        WHERE REPLACE(REPLACE(LOWER(TRIM(location)), ' ', '_'), '-', '_')=?
          AND is_active=1
        """,
        (normalized_location,)
    ).fetchall()
    if not ops: conn.close(); raise HTTPException(status_code=404, detail=f"No operators at {normalized_location}")
    paid = []
    for op in ops:
        tx = "0x"+hashlib.sha256(f"{op['id']}-{datetime.now().isoformat()}".encode()).hexdigest()[:64]
        c.execute("INSERT INTO payout_events (operator_id,operator_name,location,dhw_value,sst_value,risk_percent,payout_amount,tx_hash) VALUES (?,?,?,?,?,?,?,?)",
            (op['id'],op['name'],normalized_location,event.dhw_value,event.sst_value,event.risk_percent,0.05,tx))
        c.execute("UPDATE operators SET total_payouts=total_payouts+0.05 WHERE id=?",(op['id'],))
        paid.append({"id":op['id'],"name":op['name'],"payout":0.05,"tx_hash":tx})
    conn.commit(); conn.close()
    return {"location":normalized_location,"operators_paid":len(paid),"details":paid}

@app.get("/operators/events/all", tags=["Operators"])
def get_all_events():
    conn = get_db()
    events = conn.execute("SELECT * FROM payout_events ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(e) for e in events]

if __name__ == "__main__":
    import uvicorn
    print("ReefBond API v2.0 Starting...")
    uvicorn.run(app, host="0.0.0.0", port=8000)