# Dataset Intelligence Engine

> A production-grade, LLM-powered data preparation and health assessment system for ANY ML/AI task

---

## 🎯 What This Is

A **task-aware data intelligence platform** that combines:

1. **Deep dataset health analysis** - Statistical diagnostics, quality checks, and ML-assisted risk detection
2. **LLM-driven preprocessing** - Automated, explainable data preparation pipelines for any domain

This is NOT a toy project. This is **senior-level ML engineering**.

---

## 🧠 Core Philosophy

### You are building:
✅ A generic data preparation engine that reasons about datasets  
✅ An intelligent health checker that detects silent model killers  
✅ A system that produces executable, explainable pipelines  

### You are NOT building:
❌ A dataset-specific cleaner  
❌ A Kaggle notebook wrapper  
❌ A black-box AutoML tool  

**The intelligence lives in:** Task schemas + LLM reasoning + Statistical diagnostics + Safe execution

---

## 🏗️ System Architecture

```
                    CSV Upload
                        ↓
            ┌───────────────────────┐
            │   Dataset Profiler    │
            │  (stats, schema, QA)  │
            └───────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │                               │
        ↓                               ↓
┌───────────────┐            ┌──────────────────┐
│  Health Check │            │  Purpose Schema  │
│    Engine     │            │  (task metadata) │
└───────────────┘            └──────────────────┘
        ↓                               ↓
┌───────────────┐            ┌──────────────────┐
│ Health Report │            │   LLM Planner    │
│  + ML Risk    │            │ (JSON generator) │
│   Scoring     │            └──────────────────┘
└───────────────┘                       ↓
                            ┌──────────────────┐
                            │ Pipeline Executor│
                            │ (pandas/sklearn) │
                            └──────────────────┘
                                       ↓
                            Clean Dataset + Report
```

**Key principle:** The pipeline adapts to the task, not the dataset.




## 🔬 Module Breakdown

### 1️⃣ Dataset Profiler (Foundation)

**File:** `core/profiler.py`

Generates a complete dataset fingerprint:
- Shape, dtypes, memory usage
- Missing value percentages
- Cardinality & unique ratios
- Numeric statistics (mean, std, quartiles)
- Duplicate detection
- Problem type inference (classification/regression)

**Output:** Structured JSON profile used by all downstream modules

---

### 2️⃣ Health Check Engine (ML Diagnostics)

#### **Missing Value Analysis** (`health/missing.py`)
- Column-wise and row-wise missingness
- Impact severity scoring
- Target missing detection (instant red flag)

#### **Distribution Analysis** (`health/distribution.py`)
- Skewness & kurtosis
- IQR-based outlier detection
- Dominant category analysis for categoricals

#### **Feature Quality** (`health/features.py`)
- Constant/near-constant detection
- High cardinality categoricals
- Multicollinearity via correlation matrix
- Low mutual information features

#### **Class Imbalance** (`health/imbalance.py`)
- Minority class ratios
- Imbalance severity scoring
- Per-class sample counts

#### **⭐ Leakage Detector** (`health/leakage.py`)
**This is your standout feature.**

Techniques:
- Feature-target correlation analysis
- Single-feature model AUC (if >0.95 → 🚨)
- Time-based leakage detection
- Aggregate leakage (features using full dataset info)

**Why it matters:** Most datasets have hidden leakage. This catches it BEFORE training.

#### **Bias Detection** (`health/bias.py`)
- Group-wise target distribution
- Statistical parity difference
- Proxy detection via correlation
- Fairness metric computation

#### **Baseline Model** (`health/baseline.py`)
Fast sanity check using simple models:
- Logistic/Ridge for quick validation
- Train/test gap detection
- Overfitting signal
- Feature importance extraction

#### **Health Scoring** (`health/scoring.py`)
Weighted composite score (0-100) based on:
- Missing severity
- Leakage risk
- Bias risk
- Sample sufficiency
- Distribution quality

**Output:** Single score + verdict + top 3 risks

---

### 3️⃣ Purpose Schema System (Task Intelligence)

**File:** `core/purpose.py`

Purpose schemas describe **intent, not logic**. They guide the LLM planner.

#### Example: Price Estimation
```python
PRICE_ESTIMATION = {
    "task_type": "regression",
    "target": "price",
    "constraints": {
        "target_non_negative": True,
        "remove_outliers": True,
        "scale_numeric": True
    }
}
```

#### Example: Study Planner
```python
STUDY_PLANNER = {
    "task_type": "planning",
    "time_series": True,
    "constraints": {
        "no_negative_time": True,
        "normalize_duration": True
    }
}
```

#### Example: Recommender System
```python
RECOMMENDER = {
    "task_type": "recommendation",
    "interaction": "rating",
    "constraints": {
        "deduplicate": True,
        "categorical_ids": True
    }
}
```

**Key insight:** Same engine, different intent. No retraining needed.

---

### 4️⃣ LLM Planner (The Brain)

**File:** `core/planner.py`

#### System Prompt (Critical)
```
You are a senior ML data engineer.
You design data preprocessing pipelines.
You only return VALID JSON.
Never invent columns.
Never execute code.
Your output must be executable.
```

#### Input to LLM
```json
{
    "profile": {...},        // From profiler
    "purpose": {...},        // Task schema
    "health_report": {...}   // From health engine
}
```

#### Output from LLM
```json
{
    "steps": [
        {"op": "drop_duplicates"},
        {"op": "remove_outliers", "column": "price", "method": "iqr"},
        {"op": "impute", "columns": ["age"], "strategy": "median"},
        {"op": "scale", "columns": "numeric", "method": "standard"}
    ],
    "reason": "Regression task with skewed target and 15% missing values"
}
```

---

### 5️⃣ Pipeline Validator (Safety Layer)

**File:** `core/validator.py`

Validates LLM output before execution:
- Column existence checks
- Operation compatibility
- Parameter validity
- Dependency ordering

**Catches:** Hallucinated columns, invalid operations, type mismatches

---

### 6️⃣ Executor Engine (Deterministic Execution)

**File:** `core/executor.py`

Maps operation strings to actual functions:

```python
OP_MAP = {
    "drop_duplicates": drop_duplicates,
    "remove_outliers": remove_outliers,
    "impute": impute_missing,
    "scale": scale_numeric,
    "encode": encode_categorical
}

def execute(df, plan):
    for step in plan["steps"]:
        df = OP_MAP[step["op"]](df, step)
    return df
```

**Key:** Same executor for ALL tasks. Operations are domain-agnostic.

---

### 7️⃣ Report Builder

**File:** `core/report.py`

Converts technical outputs into human language:

```
⚠️ Your dataset has high leakage risk (confidence: 0.89)
   Column 'post_purchase_score' is suspiciously predictive.

✅ Missing values are manageable (<5% in all columns)

🔧 Recommended: Remove 'user_id' (zero variance after encoding)

📊 Health Score: 67/100 - Trainable with caution
```

**This is what recruiters read.**

---

## 🚀 API Endpoints (FastAPI)

```
POST   /upload              # Upload CSV
POST   /analyze             # Run health check
GET    /report/{id}         # Get health report
POST   /generate-pipeline   # LLM pipeline generation
POST   /execute-pipeline    # Run preprocessing
POST   /auto-fix            # One-click cleanup
```

---

## 🎨 Frontend (Next.js)

### Pages
- `/upload` - Drag & drop CSV upload
- `/report/:id` - Interactive health dashboard
- `/compare` - Compare multiple datasets

### Key Components
- **Health Dashboard** - Score, charts, warnings
- **Missing Value Heatmap**
- **Distribution Plots**
- **Correlation Matrix**
- **Leakage Risk Timeline**
- **Pipeline Visualizer** - Show LLM-generated steps

**Philosophy:** Frontend is dumb. All intelligence stays backend.

---

## 🧪 Build Phases (4-Day MVP)

### Day 1: Foundation
- `profiler.py`
- `missing.py`
- `features.py`
- Basic FastAPI setup

### Day 2: Health Checks
- `distribution.py`
- `imbalance.py`
- `scoring.py`

### Day 3: Intelligence Layer
- `leakage.py`
- `baseline.py`
- `purpose.py`

### Day 4: LLM + Execution
- `planner.py`
- `executor.py`
- `report.py`

---

## 🎯 Why This Stands Out

### Technical Depth
- Clean architecture (single responsibility)
- ML-assisted diagnostics (not just stats)
- LLM integration done RIGHT (validated, safe)
- Production-ready error handling
- Explainable outputs

### Real-World Impact
- Catches issues before training
- Saves weeks of debugging
- Works for ANY domain
- Generates audit-ready reports

---

## 🛠️ Tech Stack

**Backend:**
- FastAPI (async, auto-docs)
- Pandas, NumPy, Scikit-learn
- LLM: Claude API (Anthropic)

**Frontend:**
- Next.js + Tailwind CSS
- Recharts / D3.js
- React Query

**Storage:**
- Local filesystem / S3
- No database needed (stateless analysis)

---

## 📊 Sample Output & UI Screenshots

### Health Dashboard
![Health Dashboard Overview](https://ibb.co/KpRxjQvk)
*Overall health score with component breakdowns - instantly shows dataset readiness*

**Key Metrics Displayed:**
- **Overall Health Score:** 76.8/100 with grade visualization
- **Component Scores:** Baseline, Data Size, Distribution, Features, Imbalance, Leakage, Missing
- **Quick Stats:** Total rows (13,320), columns (9), memory (4.66 MB), duplicates (3.97%)

### Risk Detection Report
![Top Risks Detected](https://ibb.co/8w5P4Kg)
*Actionable insights with severity levels and recommended fixes*

**Example Risk Alert:**
- **Issue:** Severe Overfitting Detected (CRITICAL)
- **Metric:** Train-test performance gap: 21.93%
- **Impact:** Model will not generalize to new data
- **Recommended Action:** Increase data size, reduce model complexity, or add regularization
- **Type Classification:** SEVERE_OVERFITTING

### JSON API Response

```json
{
    "health_score": 76.8,
    "grade": "C",
    "verdict": "Safe to train after reviewing warnings",
    "file": "Bengaluru_House_Data.csv",
    "target": "price",
    "top_risks": [
        {
            "rank": 1,
            "type": "SEVERE_OVERFITTING",
            "severity": "CRITICAL",
            "title": "Severe Overfitting Detected",
            "metric": "Train-test performance gap: 21.93%",
            "impact": "Model will not generalize to new data",
            "recommended_action": "Increase data size, reduce model complexity, or add regularization"
        }
    ],
    "component_scores": {
        "baseline": 4,
        "data_size": 10,
        "distribution": 10,
        "features": 10,
        "imbalance": 6,
        "leakage": 30,
        "missing": 7
    },
    "dataset_summary": {
        "analysis_phase": "Complete",
        "shape": "13,320 × 9",
        "memory_usage": "4.66 MB",
        "missing_data": "5.17%",
        "duplicates": "3.97%",
        "target_column": "X Missing"
    },
    "suggested_pipeline": {
        "steps": [
            {"op": "drop_duplicates"},
            {"op": "impute", "columns": ["size", "bath"], "strategy": "median"},
            {"op": "remove_outliers", "column": "price", "method": "iqr"},
            {"op": "scale", "columns": "numeric", "method": "standard"}
        ],
        "reason": "Regression task with duplicates and outliers in target variable"
    }
}
```

---

## 🎓 Interview Talking Points

### When asked "What did you build?"
> "I built a generic data intelligence engine that combines statistical diagnostics with LLM-powered preprocessing. It detects issues like leakage and bias BEFORE model training, then generates explainable preprocessing pipelines for any ML task."

### When asked "Why not just use AutoML?"
> "AutoML optimizes for accuracy. I optimize for trust. My system tells you WHY your dataset is risky and HOW to fix it safely. The LLM plans, but execution is deterministic and validated."

### When asked "How does it generalize?"
> "Purpose schemas encode task intent, not logic. The same engine handles regression, classification, time-series, and recommendation systems without retraining."

---

## 🚀 Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Upload a CSV → Get instant health report → Generate preprocessing pipeline → Execute safely

---

## 📈 Future Enhancements

- Multi-dataset comparison
- Real-time monitoring dashboard
- Custom operation plugins
- Version control for pipelines
- A/B testing framework
- Automated documentation generation

---

## 🏆 What This Makes You

**Not just an ML developer.**

You're building **data infrastructure + AI reasoning systems**.

This is **senior-level engineering**.

---

**Built with intelligence. Executed with precision.**
