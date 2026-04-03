#  ReefBond API 

## Folder Structure 
```
reefbond/
├── reefbond_api.py              ← FastAPI backend 
├── requirements.txt             ← Python dependencies
├── reefbond_xgboost_model.json  ← downloaded model from colab
├── reefbond_feature_cols.pkl    ← downloaded feature list from colab
└── data/
    ├── southern_sri_lanka.txt   ← NOAA data file
    └── eastern_sri_lanka.txt    ← NOAA data file
```

## Setup Steps

### Step 1: Create folder
```bash
mkdir reefbond
cd reefbond
mkdir data
```

### Step 2: Copy files
- `reefbond_api.py` → reefbond/ folder 
- `requirements.txt` → reefbond/ folder 
- `reefbond_xgboost_model.json` → reefbond/ folder 
- `reefbond_feature_cols.pkl` → reefbond/ folder 
- `southern_sri_lanka.txt` → reefbond/data/ folder 
- `eastern_sri_lanka.txt` → reefbond/data/ folder 

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the API
```bash
python reefbond_api.py
```

### Step 5: Test in browser
- Open: http://localhost:8000/docs  
- Try: http://localhost:8000/predict/hikkaduwa
- Try: http://localhost:8000/dhw/trincomalee
- Try: http://localhost:8000/timeline/hikkaduwa?days=90
- Try: http://localhost:8000/stats

## API Endpoints Summary

| Method | Endpoint | function |
|--------|----------|-------------|
| GET | `/predict/{location}` | AI bleaching prediction + SHAP explanation |
| GET | `/dhw/{location}` | Current NOAA DHW value |
| POST | `/oracle/trigger?location=hikkaduwa` | Simulate oracle writing on-chain |
| GET | `/timeline/{location}?days=90` | Risk timeline for dashboard |
| GET | `/regions` | Available locations list |
| GET | `/stats` | Dashboard summary cards data |

## Available Locations
hikkaduwa, mirissa, unawatuna, galle, weligama, southern,
trincomalee, pigeon_island, nilaveli, batticaloa, eastern