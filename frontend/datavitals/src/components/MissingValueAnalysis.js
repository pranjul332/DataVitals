import { AlertTriangle } from "lucide-react";
import { safeGet, safeArray, getSeverityColor } from "../utils/helpers";

export default function MissingValueAnalysis({ missing, profile }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-yellow-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Missing Value Analysis
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Overall Missing</p>
          <p className="text-2xl font-bold text-gray-900">
            {safeGet(profile, "missing.missing_percentage", 0).toFixed(2)}%
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Columns Affected</p>
          <p className="text-2xl font-bold text-yellow-600">
            {safeGet(missing, "summary.columns_with_missing", 0)}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">High Severity</p>
          <p className="text-2xl font-bold text-red-600">
            {safeGet(missing, "summary.columns_high_missing", 0)}
          </p>
        </div>
      </div>

      {safeArray(missing?.column_analysis).length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Column Analysis</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {safeArray(missing.column_analysis).map((col, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${getSeverityColor(col.severity)}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{col.column || "Unknown"}</span>
                  <span className="text-sm">
                    {(col.missing_percentage || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="text-xs mt-1">
                  {col.missing_count || 0} missing · Pattern:{" "}
                  {col.pattern || "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {missing?.target_analysis && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
          <h4 className="font-semibold text-purple-900 mb-2">
            Target Column Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Missing Count:</span>
              <span className="font-medium ml-2">
                {missing.target_analysis.missing_count}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Missing %:</span>
              <span className="font-medium ml-2">
                {missing.target_analysis.missing_percentage?.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Has Missing:</span>
              <span className="font-medium ml-2">
                {missing.target_analysis.has_missing ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Severity:</span>
              <span
                className={`font-medium ml-2 px-2 py-0.5 rounded ${getSeverityColor(
                  missing.target_analysis.severity
                )}`}
              >
                {missing.target_analysis.severity}
              </span>
            </div>
          </div>
        </div>
      )}

      {missing?.row_analysis && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">
            Row-Level Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Rows with Missing:</span>
              <span className="font-medium ml-2">
                {missing.row_analysis.rows_with_missing?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">% of Rows:</span>
              <span className="font-medium ml-2">
                {missing.row_analysis.percentage_rows_with_missing?.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Max Missing per Row:</span>
              <span className="font-medium ml-2">
                {missing.row_analysis.max_missing_per_row}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
