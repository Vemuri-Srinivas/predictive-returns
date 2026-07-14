import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)
import pickle
import os

# --- Load data ---
DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/predictive_returns_dataset.csv")
df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# --- Drop identifier and target-leaking columns ---
DROP_COLS = ["Order_ID", "Customer_ID", "Material_ID", "Order_Date", "Return_Risk_Prob"]
TARGET = "Return_Risk_Flag"

X = df.drop(columns=DROP_COLS + [TARGET])
y = df[TARGET]

# --- Encode categorical columns ---
categorical_cols = X.select_dtypes(include="object").columns.tolist()
label_encoders = {}

for col in categorical_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    label_encoders[col] = le

print(f"Categorical columns encoded: {categorical_cols}")

# --- Train / test split ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows")

# --- Train Random Forest ---
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    random_state=42,
    class_weight="balanced"
)
model.fit(X_train, y_train)
print("Model training complete.")

# --- Evaluate ---
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print("\n--- Model Evaluation ---")
print(f"Accuracy  : {accuracy_score(y_test, y_pred):.4f}")
print(f"Precision : {precision_score(y_test, y_pred):.4f}")
print(f"Recall    : {recall_score(y_test, y_pred):.4f}")
print(f"F1 Score  : {f1_score(y_test, y_pred):.4f}")
print(f"AUC-ROC   : {roc_auc_score(y_test, y_prob):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"]))

# --- Feature importance ---
feature_importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": model.feature_importances_
}).sort_values("Importance", ascending=False)

print("\nFeature Importance:")
print(feature_importance.to_string(index=False))

# --- Save model and encoders ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")

with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)

with open(ENCODER_PATH, "wb") as f:
    pickle.dump(label_encoders, f)

print(f"\nModel saved : {MODEL_PATH}")
print(f"Encoders saved: {ENCODER_PATH}")
