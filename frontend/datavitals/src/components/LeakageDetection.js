import { Shield } from "lucide-react";
import { safeGet, safeArray, getRiskColor } from "../utils/helpers";

export default function LeakageDetection({ leakage }) {
  if (!leakage?.exists) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-red-600" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            🔥 Data Leakage Detection
          </h3>
          <p className="text-sm text-gray-600">
            Critical analysis to identify features that may leak target
            information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-gray-600 mb-1">Critical Leakage</p>
          <p className="text-3xl font-bold text-red-600">
            {safeGet(leakage, "summary.critical_leakage", 0)}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600 mb-1">High Risk</p>
          <p className="text-3xl font-bold text-orange-600">
            {safeGet(leakage, "summary.high_risk_leakage", 0)}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Features Analyzed</p>
          <p className="text-3xl font-bold text-blue-600">
            {safeGet(leakage, "summary.total_features_analyzed", 0)}
          </p>
        </div>
      </div>

      {safeArray(leakage?.leakage_features).length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            ⚠️ Suspicious Features
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {safeArray(leakage.leakage_features).map((feat, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getRiskColor(feat.risk)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-lg">{feat.feature}</span>
                    <span
                      className={`ml-3 text-xs px-2 py-1 rounded font-semibold uppercase ${getRiskColor(
                        feat.risk
                      )}`}
                    >
                      {feat.risk} RISK
                    </span>
                  </div>
                  <span className="text-xl font-bold">
                    {(feat.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm">
                  Detection Method:{" "}
                  <span className="font-medium">
                    {feat.method.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {safeArray(leakage?.correlation_analysis).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Top Feature-Target Correlations
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {safeArray(leakage.correlation_analysis).map((corr, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
              >
                <span className="font-medium text-gray-900 flex-1">
                  {corr.feature}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${corr.correlation * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">
                  {(corr.correlation * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
