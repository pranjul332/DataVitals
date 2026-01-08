import { BarChart3 } from "lucide-react";
import { safeGet, safeArray } from "../utils/helpers";

export default function DistributionAnalysis({ distribution }) {
  if (!distribution) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-indigo-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Distribution & Outlier Analysis
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Features</p>
          <p className="text-2xl font-bold text-blue-600">
            {safeGet(distribution, "summary.total_analyzed", 0)}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Skewed Features</p>
          <p className="text-2xl font-bold text-yellow-600">
            {safeGet(distribution, "summary.skewed_features", 0)}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Outlier Features</p>
          <p className="text-2xl font-bold text-red-600">
            {safeGet(distribution, "summary.outlier_features", 0)}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Dominated Cat.</p>
          <p className="text-2xl font-bold text-orange-600">
            {safeGet(distribution, "summary.dominated_categorical", 0)}
          </p>
        </div>
      </div>

      {safeArray(distribution?.numeric_features).length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Numeric Feature Distributions
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {safeArray(distribution.numeric_features).map((feat, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
                    {feat.column || "Unknown"}
                  </span>
                  <div className="flex gap-2">
                    {feat.skewness_flag !== "low" && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          feat.skewness_flag === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {feat.skewness_flag} skew
                      </span>
                    )}
                    {feat.outlier_percentage > 5 && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                        {feat.outlier_percentage}% outliers
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
                  <div>Mean: {feat.statistics?.mean?.toFixed(2)}</div>
                  <div>Median: {feat.statistics?.median?.toFixed(2)}</div>
                  <div>Std: {feat.statistics?.std?.toFixed(2)}</div>
                  <div>Skew: {feat.skewness?.toFixed(2)}</div>
                  <div>Outliers: {feat.outliers?.count || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {safeArray(distribution?.categorical_features).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Categorical Feature Distributions
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {safeArray(distribution.categorical_features).map((feat, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
                    {feat.column || "Unknown"}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                    {feat.cardinality} unique
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Dominant:{" "}
                  <span className="font-medium">
                    {feat.dominant_category?.value}
                  </span>{" "}
                  ({feat.dominant_category?.percentage}%)
                </div>
                <div className="space-y-1">
                  {safeArray(feat.top_categories).map((cat, cidx) => (
                    <div key={cidx} className="flex items-center gap-2 text-xs">
                      <div className="w-24 truncate">{cat.value}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-gray-600">
                        {cat.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
