import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

np.random.seed(42)
random.seed(42)

N = 10000

# --- Identifiers ---
order_ids = [f"ORD{str(i).zfill(5)}" for i in range(10001, 10001 + N)]
customer_ids = [f"C{random.randint(1000, 9999)}" for _ in range(N)]
material_ids = [f"P{random.randint(1000, 1999)}" for _ in range(N)]

# --- Categorical features ---
material_groups = np.random.choice(
    ["shirts", "pants", "shoes", "dresses", "t-shirts", "jackets", "bags"],
    size=N, p=[0.20, 0.15, 0.15, 0.20, 0.15, 0.10, 0.05]
)
sizes = np.random.choice(["S", "M", "L", "XL"], size=N, p=[0.20, 0.35, 0.30, 0.15])
seasons = np.random.choice(["Spring", "Summer", "Autumn", "Winter"], size=N)
brands = np.random.choice(["BrandA", "BrandB", "BrandC", "BrandD"], size=N)
channels = np.random.choice(
    ["Online", "Retail Store", "Marketplace"],
    size=N, p=[0.45, 0.25, 0.30]
)
customer_types = np.random.choice(["new", "repeat"], size=N, p=[0.40, 0.60])

# --- Numeric features ---
prices = np.random.choice([499, 999, 1499, 1999, 2499, 2599], size=N)
discounts = np.round(np.random.uniform(0, 60, size=N), 2)
quantities = np.random.choice([1, 2, 3, 4, 5], size=N, p=[0.50, 0.25, 0.13, 0.07, 0.05])

# Customer purchase count based on customer type
purchase_counts = []
for ct in customer_types:
    if ct == "new":
        purchase_counts.append(np.random.choice([0, 1], p=[0.60, 0.40]))
    else:
        purchase_counts.append(np.random.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20],
                                                 p=[0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.05, 0.05]))
purchase_counts = np.array(purchase_counts)

# --- Order dates ---
start_date = datetime(2024, 1, 1)
order_dates = [start_date + timedelta(hours=random.randint(0, 8760)) for _ in range(N)]
order_dates = [d.strftime("%d-%m-%Y %H:%M") for d in order_dates]

# --- Return risk logic (realistic rules) ---
def calculate_return_probability(i):
    prob = 0.10  # base probability

    # Discount impact (high discount = higher return risk)
    if discounts[i] > 50:
        prob += 0.25
    elif discounts[i] > 35:
        prob += 0.15
    elif discounts[i] > 20:
        prob += 0.08

    # Customer type impact
    if customer_types[i] == "new":
        prob += 0.20

    # Purchase count impact (loyal customers return less)
    if purchase_counts[i] == 0:
        prob += 0.15
    elif purchase_counts[i] == 1:
        prob += 0.10
    elif purchase_counts[i] <= 4:
        prob += 0.05
    elif purchase_counts[i] <= 10:
        prob -= 0.05
    else:
        prob -= 0.08

    # Size impact (XL and S tend to have more fit issues)
    if sizes[i] in ["XL", "S"]:
        prob += 0.08

    # Material group impact
    if material_groups[i] in ["dresses", "shoes"]:
        prob += 0.10
    elif material_groups[i] in ["bags"]:
        prob -= 0.05

    # Channel impact
    if channels[i] == "Marketplace":
        prob += 0.10
    elif channels[i] == "Online":
        prob += 0.05

    # Season impact
    if seasons[i] in ["Winter"]:
        prob += 0.05

    # Quantity impact (bulk orders more likely returned)
    if quantities[i] >= 3:
        prob += 0.08

    # Price impact (expensive items returned more)
    if prices[i] >= 2499:
        prob += 0.07
    elif prices[i] <= 499:
        prob += 0.03

    # Add noise
    prob += np.random.normal(0, 0.05)

    # Clamp between 0.02 and 0.97
    return round(float(np.clip(prob, 0.02, 0.97)), 2)

probs = [calculate_return_probability(i) for i in range(N)]
flags = [1 if p >= 0.5 else 0 for p in probs]

# --- Build DataFrame ---
df = pd.DataFrame({
    "Order_ID": order_ids,
    "Customer_ID": customer_ids,
    "Material_ID": material_ids,
    "Customer_Type": customer_types,
    "Material_Group": material_groups,
    "Price": prices,
    "Size": sizes,
    "Discount": discounts,
    "Quantity": quantities,
    "Order_Date": order_dates,
    "Season": seasons,
    "Brand": brands,
    "Channel": channels,
    "Customer_Purchase_Count": purchase_counts,
    "Return_Risk_Prob": probs,
    "Return_Risk_Flag": flags
})

output_path = "/Users/i577113/Downloads/predictive_returns_dataset.csv"
df.to_csv(output_path, index=False)

print(f"Dataset saved: {output_path}")
print(f"Total records: {len(df)}")
print(f"\nReturn flag distribution:")
print(df["Return_Risk_Flag"].value_counts())
print(f"\nReturn rate: {df['Return_Risk_Flag'].mean()*100:.1f}%")
print(f"\nSample:")
print(df.head(5).to_string())
