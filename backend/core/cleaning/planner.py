import json
from typing import Dict, Any
from openai import OpenAI
from config import Config

class LLMPlanner:
    """
    The Brain: Uses OpenAI GPT to generate data preprocessing pipelines.
    Task-agnostic and domain-independent.
    """

    def __init__(self, api_key: str = None):
        self.client = OpenAI(
            api_key=api_key or Config.OPENAI_API_KEY
        )
        self.model = Config.MODEL_NAME

    def generate_plan(
        self,
        profile: Dict[str, Any],
        purpose: Dict[str, Any],
        target_column: str = None
    ) -> Dict[str, Any]:

        system_prompt = self._build_system_prompt()
        user_message = self._build_user_message(profile, purpose, target_column)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=Config.MAX_TOKENS,
            temperature=0.2,  # important for stable JSON
        )

        plan_text = response.choices[0].message.content
        return self._extract_json(plan_text)

    # ---------------- PROMPTS ---------------- #

    def _build_system_prompt(self) -> str:
      return """You are a senior ML data engineer specializing in data preprocessing.

Your ONLY responsibility is to DESIGN a preprocessing pipeline.
You MUST NOT execute code or transform data.

====================
CRITICAL RULES
====================
1. Return ONLY valid JSON. No markdown. No code blocks. No explanations outside JSON.
2. NEVER invent column names — use ONLY columns provided in the dataset profile.
3. NEVER execute code — you ONLY design the plan.
4. Be task-aware — different ML tasks require different preprocessing.
5. Be conservative — apply the minimal necessary operations.
6. Follow the EXACT JSON schema below.
7. Use ONLY the allowed operations and enum values listed.

====================
STRICT ENUM RULES (NON-NEGOTIABLE)
====================

You MUST use ONLY these operation names:
- drop_duplicates
- drop_columns
- fill_missing
- remove_outliers
- scale_numeric
- encode_categorical
- create_feature
- sort_by
- filter_rows

You MUST use ONLY these encoding methods:
- onehot
- label
- ordinal

You MUST use ONLY these scaling methods:
- standard
- minmax
- robust

FORBIDDEN (DO NOT USE):
- remove_duplicates
- impute_missing
- cap_outliers
- scale_features
- one_hot
- standard_scaler

If ANY operation name or enum is invalid, the output will be rejected.

====================
JSON OUTPUT FORMAT (EXACT)
====================
{
  "steps": [
    {
      "op": "operation_name",
      "params": { }
    }
  ],
  "reasoning": "Brief explanation of decisions",
  "warnings": ["Any concerns or recommendations"],
  "estimated_impact": {
    "rows_affected": "estimate",
    "columns_affected": ["list"]
  }
}

====================
OPERATION DEFINITIONS
====================

- drop_duplicates:
  Remove duplicate rows.
  params: {}

- drop_columns:
  Remove columns.
  params: { "columns": ["col1", "col2"] }

- fill_missing:
  Fill missing values.
  params:
    {
      "column": "col",
      "strategy": "mean | median | mode | constant",
      "value": optional
    }

- remove_outliers:
  Remove outliers.
  params:
    {
      "column": "col",
      "method": "iqr | zscore",
      "threshold": number
    }

- scale_numeric:
  Scale numeric features.
  params:
    {
      "columns": ["col1"],
      "method": "standard | minmax | robust"
    }

- encode_categorical:
  Encode categorical features.
  params:
    {
      "columns": ["col1"],
      "method": "onehot | label | ordinal"
    }

- create_feature:
  Create a new feature.
  params:
    {
      "name": "new_column",
      "expression": "description"
    }

- sort_by:
  Sort the dataset.
  params:
    {
      "column": "col",
      "ascending": true
    }

- filter_rows:
  Filter rows based on condition.
  params:
    {
      "condition": "description"
    }

====================
FINAL INSTRUCTIONS
====================
- Choose operations ONLY from the allowed list.
- Use column names EXACTLY as provided.
- If unsure, prefer fewer steps.
- If an operation is not applicable, omit it.
- Output ONLY the JSON object. No extra text.
"""


    def _build_user_message(
        self,
        profile: Dict[str, Any],
        purpose: Dict[str, Any],
        target_column: str = None
    ) -> str:

        simplified_profile = {
            "rows": profile["basic_info"]["rows"],
            "columns": profile["basic_info"]["column_names"],
            "duplicates": profile["basic_info"]["duplicates"],
            "quality": profile["quality"],
            "column_details": {}
        }

        for col, details in profile["columns"].items():
            simplified_profile["column_details"][col] = {
                "type": details["inferred_type"],
                "missing_percent": details["missing_percent"],
                "unique_ratio": details["unique_ratio"]
            }

        message = f"""
DATASET PROFILE:
{json.dumps(simplified_profile, indent=2)}

PURPOSE:
{json.dumps(purpose, indent=2)}
"""

        if target_column:
            message += f"\nTARGET COLUMN: {target_column}\n"

        message += "\nReturn ONLY valid JSON."

        return message

    # ---------------- JSON PARSER ---------------- #

    def _extract_json(self, text: str) -> Dict[str, Any]:
        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(text[start:end])
            raise ValueError("Failed to parse JSON from model output")

    # ---------------- REGENERATION ---------------- #

    def regenerate_plan(
        self,
        profile: Dict[str, Any],
        purpose: Dict[str, Any],
        feedback: str,
        previous_plan: Dict[str, Any]
    ) -> Dict[str, Any]:

        system_prompt = self._build_system_prompt()

        user_message = f"""
PREVIOUS PLAN:
{json.dumps(previous_plan, indent=2)}

FEEDBACK:
{feedback}

PROFILE:
{json.dumps(profile, indent=2)}

PURPOSE:
{json.dumps(purpose, indent=2)}

Return ONLY valid JSON.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=Config.MAX_TOKENS,
            temperature=0.2,
        )

        return self._extract_json(response.choices[0].message.content)
