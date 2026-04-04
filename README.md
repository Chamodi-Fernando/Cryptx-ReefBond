# 🪸 ReefBond — Parametric Coral Bleaching Insurance

**CryptX 2.0 Hackathon | University Category**
**Domain: Tourism, Culture & Inclusive Experiences**

---

## Problem Statement

Sri Lanka's coral reefs are experiencing severe bleaching events driven by rising sea surface temperatures, directly threatening the dive tourism industry that hundreds of operators depend on. NOAA predicted 60% bleaching thermal stress for Southern Sri Lanka in 2024, and live coral cover at Pigeon Island has dropped from 80% to just 21%.

When bleaching events hit, dive bookings collapse overnight — yet **no insurance product exists** for Sri Lankan dive operators. Traditional insurance fails because it requires physical underwater assessment, weeks of claims processing, extensive documentation that small operators cannot produce, and minimum policy sizes that make individual dive centers uninsurable.

The UN-backed Sri Lanka Coral Reef Initiative (SLCRI) has explicitly identified the need for parametric reef insurance in their 2024 UNDP report. The need is confirmed. The product doesn't exist — until ReefBond.

---

## Proposed Solution

**ReefBond** is a blockchain-based parametric insurance protocol that monitors sea surface temperature via NOAA satellite data, uses an AI model to predict bleaching risk, and automatically triggers smart contract payouts when defined thresholds are crossed — without the operator filing a single claim.

### How It Works

```
1. PREDICT          2. TRIGGER              3. PAY
─────────           ─────────────           ─────────────
AI model watches    SST crosses DHW         Smart contract
NOAA satellite      threshold (4°C-weeks)   auto-releases
data 24/7 for       → Oracle writes         payout to operator
Sri Lankan reefs    event on-chain          wallet. No claim.
```

### Key Features

- **AI Prediction Engine** — XGBoost model trained on 40 years of NOAA data, 89.87% accuracy, 14-day ahead prediction with SHAP explainability
- **Smart Contract** — Solidity-based parametric insurance with automatic payouts when DHW threshold is crossed
- **Real-time Dashboard** — React dashboard with Leaflet maps, risk timeline, operator management
- **REST API** — FastAPI backend serving predictions, NOAA data, oracle triggers, and operator database
- **Operator Management** — SQLite database for operator registration, premium tracking, and payout history

---

## Team Details

| Name | Role | University |
|------|------|-----------|
| Senumi | AI Model + Backend + Frontend | NSBM Green University |
| [Teammate] | Smart Contract + Deployment | NSBM Green University |

**Selected Domain:** Tourism, Culture & Inclusive Experiences

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI Model | XGBoost + SHAP | Bleaching prediction + explainability |
| Data Source | NOAA Coral Reef Watch | 40 years of satellite SST/DHW data |
| Backend | FastAPI (Python) | REST API with 10+ endpoints |
| Database | SQLite | Operator registration + payout records |
| Smart Contract | Solidity 0.8.19 | Parametric insurance auto-payout |
| Blockchain | Polygon (EVM) | Low gas fees, fast finality |
| Frontend | React + Leaflet.js | Real-time map dashboard |
| Deployment | Netlify (frontend) | CDN-hosted dashboard |

### Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ NOAA Coral   │     │ FastAPI      │     │ React        │
│ Reef Watch   │────▶│ Backend      │────▶│ Dashboard    │
│ (Satellite)  │     │ (Port 8000)  │     │ (Port 3000)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐     ┌──────────────┐
                     │ XGBoost      │     │ SQLite DB    │
                     │ AI Model     │     │ (Operators)  │
                     │ (89.87% acc) │     └──────────────┘
                     └──────────────┘
                            │
                     ┌──────▼───────┐     ┌──────────────┐
                     │ Oracle       │────▶│ Smart        │
                     │ (API Bridge) │     │ Contract     │
                     └──────────────┘     │ (Solidity)   │
                                          └──────────────┘
```

### Cloud Architecture Plan (Production)

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud                             │
│                                                         │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐        │
│  │ Lambda  │───▶│ S3       │───▶│ ECS/Fargate │        │
│  │ (NOAA   │    │ (Data    │    │ (FastAPI +  │        │
│  │ Fetcher)│    │ Storage) │    │ XGBoost)    │        │
│  └─────────┘    └──────────┘    └──────┬──────┘        │
│  Runs every 6h                         │               │
│                                 ┌──────▼──────┐        │
│                                 │ RDS/Aurora  │        │
│                                 │ (PostgreSQL)│        │
│                                 └─────────────┘        │
│                                        │               │
│  ┌──────────┐                  ┌───────▼──────┐        │
│  │CloudWatch│                  │ API Gateway  │        │
│  │(Monitor) │                  └───────┬──────┘        │
│  └──────────┘                          │               │
└────────────────────────────────────────┼───────────────┘
                                         │
                    ┌────────────────────▼───────────────┐
                    │         Polygon Mainnet             │
                    │  Chainlink Oracle → Smart Contract  │
                    └────────────────────────────────────┘
                                         │
                    ┌────────────────────▼───────────────┐
                    │      Netlify / Vercel (CDN)         │
                    │      React Dashboard Hosting        │
                    └────────────────────────────────────┘
```

---

## How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend (FastAPI)

```bash
cd reefbond
pip install -r requirements.txt
python reefbond_api.py
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend (React Dashboard)

```bash
cd reefbond-dashboard
npm install
npm start
# Dashboard runs at http://localhost:3000
```

### AI Model (Google Colab)

1. Open `ReefBond.ipynb` in Google Colab
2. Upload `southern_sri_lanka.txt` and `eastern_sri_lanka.txt`
3. Run all cells sequentially
4. Model achieves 89.87% accuracy on test data

### Smart Contract (Remix IDE)

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create `ReefBond.sol` and paste the contract code
3. Compile with Solidity 0.8.19
4. Deploy on Remix VM or Polygon Amoy Testnet

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/predict/{location}` | AI bleaching prediction + SHAP explanation |
| GET | `/dhw/{location}` | Current NOAA DHW reading |
| GET | `/timeline/{location}` | 90-day risk timeline |
| GET | `/stats` | Dashboard summary data |
| POST | `/oracle/trigger` | Simulate oracle event |
| POST | `/operators/register` | Register dive operator |
| GET | `/operators` | List all operators |
| POST | `/operators/payout` | Trigger payout for location |
| GET | `/operators/events/all` | All payout event history |

**Available locations:** hikkaduwa, mirissa, unawatuna, galle, weligama, trincomalee, pigeon_island, nilaveli, batticaloa

---

## Research References

1. Arcodia et al. (2025) — "An Explainable ML Prediction System for Early Warning of Heat Stress on Coral Reefs"
2. Goffard & Loisel (2024) — "Collaborative and Parametric Insurance on the Ethereum Blockchain"
3. Chainlink (2024-2025) — Decentralized Oracle Network for parametric insurance
4. IEEE (2025) — "Coral Reef Bleaching Prediction: A ML Approach Using Environmental Factors"

---

## License

This project was built for CryptX 2.0 Hackathon — University Category.