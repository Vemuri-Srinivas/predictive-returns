import pickle
import os
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Predictive Returns API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load model and encoders ---
# Support both local dev (relative) and Docker (/app/model/)
BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(BASE, "../model/model.pkl"))
ENCODER_PATH = os.environ.get("ENCODER_PATH", os.path.join(BASE, "../model/encoders.pkl"))

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

with open(ENCODER_PATH, "rb") as f:
    encoders = pickle.load(f)

# Column order must match training
FEATURE_COLS = [
    "Customer_Type", "Material_Group", "Price",
    "Size", "Discount", "Quantity", "Season",
    "Brand", "Channel", "Customer_Purchase_Count"
]

CATEGORICAL_COLS = ["Customer_Type", "Material_Group", "Size", "Season", "Brand", "Channel"]


class OrderInput(BaseModel):
    customer_type: str
    material_group: str
    price: float
    size: str
    discount: float
    quantity: int
    season: str
    brand: str
    channel: str
    customer_purchase_count: int


@app.post("/api/predict")
def predict(order: OrderInput):
    raw = {
        "Customer_Type": order.customer_type,
        "Material_Group": order.material_group,
        "Price": order.price,
        "Size": order.size,
        "Discount": order.discount,
        "Quantity": order.quantity,
        "Season": order.season,
        "Brand": order.brand,
        "Channel": order.channel,
        "Customer_Purchase_Count": order.customer_purchase_count,
    }

    # Encode categoricals
    for col in CATEGORICAL_COLS:
        le = encoders[col]
        value = raw[col]
        if value not in le.classes_:
            return {"error": f"Unknown value '{value}' for field '{col}'"}
        raw[col] = le.transform([value])[0]

    # Build feature vector in correct order
    features = np.array([[raw[col] for col in FEATURE_COLS]])

    prob = float(model.predict_proba(features)[0][1])
    flag = int(prob >= 0.5)

    return {
        "return_risk_prob": round(prob, 4),
        "return_risk_flag": flag,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
