"""
XGBoost training script for RT>DAM binary classification.
Steps: load/clean → define features → encode categoricals → sample weights → train → plot → feature importance
"""

import subprocess
import sys

# ── 0. Ensure dependencies ───────────────────────────────────────────────────
for pkg in ("xgboost", "scikit-learn", "matplotlib", "pandas", "numpy"):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", pkg])

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import OneHotEncoder
import xgboost as xgb

DATA_DIR = "/Users/gabrielkessler/Desktop/OnPeak"

# ── 1. Load and clean ────────────────────────────────────────────────────────
print("=" * 60)
print("STEP 1 — LOAD AND CLEAN")
print("=" * 60)

train_raw = pd.read_csv(f"{DATA_DIR}/XGBoost_Data - 2019-2023.csv")
val_raw   = pd.read_csv(f"{DATA_DIR}/XGBoost_Data - 2024.csv")
test_raw  = pd.read_csv(f"{DATA_DIR}/XGBoost_Data - 2025.csv")

# Drop junk columns (unnamed / metadata) from the training file
# pandas renames blank CSV headers to "Unnamed: N", and metadata values also become column names
JUNK = {"", "Lamba (half life)", "1 year", "0.0019"}
train_raw = train_raw.loc[:, ~(
    train_raw.columns.str.strip().isin(JUNK) |
    train_raw.columns.str.startswith("Unnamed:")
)]

# Drop Count (training only)
if "Count" in train_raw.columns:
    train_raw = train_raw.drop(columns=["Count"])
    print("Dropped 'Count' from training set.")

# Rename DALMP → DAM LMP in val/test so column names align
for df in (val_raw, test_raw):
    if "DALMP" in df.columns:
        df.rename(columns={"DALMP": "DAM LMP"}, inplace=True)

# Drop leaky columns from all three
leaky = ["RT LMP", "RT DAM Spread"]
train_raw = train_raw.drop(columns=[c for c in leaky if c in train_raw.columns])
val_raw   = val_raw.drop(columns=[c for c in leaky if c in val_raw.columns])
test_raw  = test_raw.drop(columns=[c for c in leaky if c in test_raw.columns])

# Verify column alignment (ignore Weight which only exists in train)
train_cols = set(train_raw.columns) - {"Weight"}
val_cols   = set(val_raw.columns)
test_cols  = set(test_raw.columns)

assert train_cols == val_cols == test_cols, (
    f"Column mismatch!\n  train: {sorted(train_cols)}\n  val:   {sorted(val_cols)}\n  test:  {sorted(test_cols)}"
)
print(f"\nColumn names match across all files ✓")
print(f"Shared columns: {sorted(train_cols)}\n")

for name, df in [("2019-2023 (train)", train_raw), ("2024 (val)", val_raw), ("2025 (test)", test_raw)]:
    print(f"--- {name} ---")
    print(f"Shape: {df.shape}")
    print(df.head())
    print()

# ── 2. Define features and target ───────────────────────────────────────────
print("=" * 60)
print("STEP 2 — FEATURES AND TARGET")
print("=" * 60)

TARGET = "RT>DAM"
CAT_FEATURES  = ["Day of week", "Month", "Season"]
NUM_FEATURES  = [
    "DAM LMP", "DAM yesterday", "DAM 7 days ago",
    "DAM to DAM spread", "Rolling 7d DAM mean", "Rolling 7d RT DAM spread",
]
ALL_FEATURES  = NUM_FEATURES + CAT_FEATURES

# Drop first 7 rows of training set (rolling features are NaN / incomplete)
train = train_raw.iloc[7:].copy().reset_index(drop=True)
val   = val_raw.copy().reset_index(drop=True)
test  = test_raw.copy().reset_index(drop=True)

y_train = train[TARGET].astype(int)
y_val   = val[TARGET].astype(int)
y_test  = test[TARGET].astype(int)

counts = y_train.value_counts().sort_index()
total  = len(y_train)
print(f"\nClass balance (training):")
print(f"  0 (RT ≤ DAM): {counts[0]:4d}  ({100*counts[0]/total:.1f}%)")
print(f"  1 (RT > DAM): {counts[1]:4d}  ({100*counts[1]/total:.1f}%)")
print()

# ── 3. Encode categorical features ──────────────────────────────────────────
print("=" * 60)
print("STEP 3 — ONE-HOT ENCODING")
print("=" * 60)

enc = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
enc.fit(train[CAT_FEATURES])

def encode(df):
    ohe = enc.transform(df[CAT_FEATURES])
    ohe_cols = enc.get_feature_names_out(CAT_FEATURES)
    ohe_df = pd.DataFrame(ohe, columns=ohe_cols, index=df.index)
    return pd.concat([df[NUM_FEATURES].reset_index(drop=True),
                      ohe_df.reset_index(drop=True)], axis=1)

X_train = encode(train)
X_val   = encode(val)
X_test  = encode(test)

print(f"Encoded feature matrix shape — train: {X_train.shape}, val: {X_val.shape}, test: {X_test.shape}")
print(f"Features ({X_train.shape[1]} total): {list(X_train.columns)}\n")

# ── 4. Sample weights ────────────────────────────────────────────────────────
print("=" * 60)
print("STEP 4 — SAMPLE WEIGHTS")
print("=" * 60)

w_train = train["Weight"].values
print(f"Weight column loaded from training set. Min={w_train.min():.5f}, Max={w_train.max():.5f}, Mean={w_train.mean():.5f}\n")

# ── 5. Train XGBoost ─────────────────────────────────────────────────────────
print("=" * 60)
print("STEP 5 — TRAIN XGBOOST")
print("=" * 60)

model = xgb.XGBClassifier(
    objective          = "binary:logistic",
    eval_metric        = "logloss",
    max_depth          = 4,
    n_estimators       = 1000,
    learning_rate      = 0.05,
    subsample          = 0.8,
    colsample_bytree   = 0.8,
    early_stopping_rounds = 50,
    verbosity          = 1,
    random_state       = 42,
)

model.fit(
    X_train, y_train,
    sample_weight      = w_train,
    eval_set           = [(X_train, y_train), (X_val, y_val)],
    verbose            = 50,
)

best_iter = model.best_iteration
results   = model.evals_result()
best_val_logloss = results["validation_1"]["logloss"][best_iter]

print(f"\nBest iteration:        {best_iter}")
print(f"Best val logloss:      {best_val_logloss:.6f}\n")

# ── 6. Plot logloss curve ────────────────────────────────────────────────────
print("=" * 60)
print("STEP 6 — PLOT LOGLOSS CURVE")
print("=" * 60)

train_logloss = results["validation_0"]["logloss"]
val_logloss   = results["validation_1"]["logloss"]
iters = range(1, len(train_logloss) + 1)

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(iters, train_logloss, label="Train logloss",      color="steelblue",  linewidth=1.2)
ax.plot(iters, val_logloss,   label="Validation logloss", color="darkorange", linewidth=1.2)
ax.axvline(best_iter + 1, color="red", linestyle="--", linewidth=1, label=f"Best iter ({best_iter + 1})")
ax.set_xlabel("Number of trees")
ax.set_ylabel("Log Loss")
ax.set_title("XGBoost Training vs Validation Log Loss")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()

out_path = f"{DATA_DIR}/logloss_curve.png"
plt.savefig(out_path, dpi=150)
print(f"Plot saved to: {out_path}\n")

# ── 7. Feature importance ────────────────────────────────────────────────────
print("=" * 60)
print("STEP 7 — FEATURE IMPORTANCE (top 10)")
print("=" * 60)

importances = pd.Series(model.feature_importances_, index=X_train.columns)
top10 = importances.sort_values(ascending=False).head(10)
print(top10.to_string())
print("\nDone. Awaiting your review before calibration.")
