# Predictive Returns — Project Context

## What this project is
A PoC (Proof of Concept) for a **Predictive Return Model** built for a Consumer Industry client.
The goal is to predict whether a customer order will be returned **before it is shipped** from the distribution center.

## Background
- Use case sourced from SAP ASC Bangalore deck (`AI.Return.pptx`)
- Client has **no historical data yet** — mock data is used for the PoC
- The deck proposed a Random Forest model; we aligned on that for Phase 1
- SAP Business Data Cloud (BDC) was in the original architecture but **dropped** — not needed for PoC with mock data
- The model accuracy numbers are not meaningful until real data is used — PoC only validates the pipeline

## Phase 1 (current)
- Predict return risk for a single order (real-time, user input)
- Show risk probability + flag in a simple UI

## Phase 2 (future)
- Merchandise Planner: forecast return volumes by category
- Customer Segmentation: target high-return-probability customers
- Pricing & Promotion Strategy: understand discount impact on returns
- Quality Control: flag products/seasons with high return rates
- Logistics: optimize reverse logistics routing
- Integration with Merchandising, Logistics, Order Fulfillment systems

## Dataset
- 10,000 mock records generated via `data/generate_dataset.py`
- File: `data/predictive_returns_dataset.csv`

### Columns
| Column | Type | Notes |
|---|---|---|
| Order_ID | Identifier | ORD10001 format |
| Customer_ID | Identifier | C#### format |
| Material_ID | Identifier | P#### format |
| Customer_Type | Categorical | new / repeat |
| Material_Group | Categorical | shirts, pants, shoes, dresses, t-shirts, jackets, bags |
| Price | Numeric | 499–2599 (INR) |
| Size | Categorical | S, M, L, XL |
| Discount | Numeric | 0–60% |
| Quantity | Numeric | 1–5 |
| Order_Date | DateTime | dd-mm-yyyy HH:MM |
| Season | Categorical | Spring, Summer, Autumn, Winter |
| Brand | Categorical | BrandA, BrandB, BrandC, BrandD |
| Channel | Categorical | Online, Retail Store, Marketplace |
| Customer_Purchase_Count | Numeric | 0–20+ |
| Return_Risk_Prob | Float | 0.0–1.0 (target, not fed to model) |
| Return_Risk_Flag | Binary | 0 = low risk, 1 = high risk (target) |

### Return logic baked into mock data
- High discount → higher return risk
- New customer → higher risk
- Low purchase count → higher risk
- Marketplace channel → higher risk
- XL/S sizes → higher risk (fit issues)
- Dresses/shoes → higher risk
- Expensive items → slightly higher risk

## Model
- Algorithm: **Random Forest Classifier** (scikit-learn)
- Training script: `model/train.py`
- Saved model: `model/model.pkl`
- Saved encoders: `model/encoders.pkl`
- Train/test split: 80/20

### Model performance (on mock data — not meaningful for real world)
| Metric | Score |
|---|---|
| Accuracy | 91% |
| Precision | 92% |
| Recall | 89% |
| F1 Score | 90% |
| AUC-ROC | 97.7% |

### Top features by importance
1. Customer_Purchase_Count — 39.7%
2. Customer_Type — 31.3%
3. Discount — 13.9%
4. Material_Group — 3%

## API
- Framework: **FastAPI**
- File: `api/app.py`
- Runs on: `http://localhost:8000`
- Endpoint: `POST /api/predict`
- Health check: `GET /api/health`

### Predict request body
```json
{
  "customer_type": "new",
  "material_group": "dresses",
  "price": 1999,
  "size": "XL",
  "discount": 45.5,
  "quantity": 1,
  "season": "Spring",
  "brand": "BrandC",
  "channel": "Marketplace",
  "customer_purchase_count": 0
}
```

### Predict response
```json
{
  "return_risk_prob": 0.9997,
  "return_risk_flag": 1
}
```

## UI
- Framework: **React + Vite** (CSS Modules)
- Folder: `ui/`
- Design: matches AI-Insights-Dashboard project (same design tokens, same sidebar-left + main-right layout)
- Runs on: `http://localhost:5173`
- Vite proxy: `/api` → `http://localhost:8000`

### UI layout
- **Left sidebar**: 10 input fields (dropdowns + number inputs) + Predict button
- **Right panel**: Risk badge (High/Low), probability gauge bar, order summary table

## How to run
```bash
# Terminal 1 — API
cd /Users/i577113/projects/predictive-returns
python3 -m uvicorn api.app:app --reload --port 8000

# Terminal 2 — UI
cd /Users/i577113/projects/predictive-returns/ui
npm run dev
```
Open: http://localhost:5173

## Architecture decisions
- No SAP BTP / AI Core for PoC — too much overhead for mock data demo
- No BDC — unnecessary without real multi-source data
- FastAPI chosen for simplicity — easy to later wrap in Docker for AI Core deployment
- React chosen to match existing AI-Insights-Dashboard codebase style
- Threshold for high risk: probability >= 0.5

## Next steps (when moving beyond PoC)
1. Replace mock data with real S/4HANA order + return history
2. Retrain model on real data
3. Containerize FastAPI app (Docker) and deploy on SAP AI Core
4. Wrap in BTP CAP service for enterprise integration
5. Add bulk CSV upload for batch scoring
6. Add feedback loop — actual return outcome fed back to retrain model
