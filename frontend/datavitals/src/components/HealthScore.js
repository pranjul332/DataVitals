import {
  Activity,
  ThumbsUp,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { safeGet, getGradeColor } from "../utils/helpers";

const getVerdictIcon = (status) => {
  if (status === "excellent")
    return <ThumbsUp className="w-8 h-8 text-green-600" />;
  if (status === "good")
    return <CheckCircle className="w-8 h-8 text-blue-600" />;
  if (status === "warning")
    return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
  return <AlertOctagon className="w-8 h-8 text-red-600" />;
};

export default function HealthScore({ response, insights }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {getVerdictIcon(response.verdict?.status)}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {response.verdict?.message || "Analysis Complete"}
            </h2>
            <p className="text-gray-600">
              File: {safeGet(insights, "metadata.filename", "N/A")}
            </p>
            {safeGet(insights, "metadata.target_column") && (
              <p className="text-sm text-indigo-600">
                Target: {insights.metadata.target_column}
              </p>
            )}
          </div>
        </div>
        <div className="text-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${getGradeColor(
              response.grade
            )}`}
          >
            {response.grade}
          </div>
          <p className="text-sm text-gray-600 mt-2">Grade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Health Score
            </h3>
          </div>
          <p className="text-4xl font-bold text-indigo-600">
            {response.health_score?.toFixed(1)}/100
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {response.verdict?.description}
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Component Scores
          </h3>
          <div className="space-y-2">
            {Object.entries(response.component_scores || {}).map(
              ([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 capitalize flex-1">
                    {key.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12 text-right">
                    {value.toFixed(0)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Rows</p>
          <p className="text-3xl font-bold text-blue-600">
            {safeGet(insights, "profile.shape.rows", 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Columns</p>
          <p className="text-3xl font-bold text-purple-600">
            {safeGet(insights, "profile.shape.columns", 0)}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Memory Size</p>
          <p className="text-3xl font-bold text-orange-600">
            {safeGet(insights, "profile.memory.mb", 0).toFixed(2)} MB
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Duplicates</p>
          <p className="text-3xl font-bold text-green-600">
            {safeGet(insights, "profile.duplicates.percentage", 0).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
