import { AlertCircle } from "lucide-react";
import { safeArray } from "../utils/helpers";

export default function TargetAnalysis({ imbalance }) {
  if (!imbalance?.exists) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-8 h-8 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Target Variable Analysis
        </h3>
      </div>

      {imbalance.task_type === "classification" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Task Type</p>
              <p className="text-lg font-bold text-purple-600 capitalize">
                {imbalance.classification_type}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Classes</p>
              <p className="text-2xl font-bold text-blue-600">
                {imbalance.n_classes}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Majority</p>
              <p className="text-2xl font-bold text-green-600">
                {imbalance.imbalance?.majority_percentage}%
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Imbalance Ratio</p>
              <p className="text-2xl font-bold text-red-600">
                {imbalance.imbalance?.ratio}:1
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg mb-6 ${
              imbalance.imbalance?.severity === "severe"
                ? "bg-red-50 border border-red-200"
                : imbalance.imbalance?.severity === "moderate"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <p className="font-semibold mb-1">
              Imbalance Severity:{" "}
              <span className="capitalize">
                {imbalance.imbalance?.severity}
              </span>
            </p>
            <p className="text-sm">
              Majority class:{" "}
              <span className="font-medium">
                {imbalance.imbalance?.majority_class}
              </span>{" "}
              ({imbalance.imbalance?.majority_count} samples)
              {" • "}
              Minority class:{" "}
              <span className="font-medium">
                {imbalance.imbalance?.minority_class}
              </span>{" "}
              ({imbalance.imbalance?.minority_count} samples)
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 mb-3">
            Class Distribution
          </h4>
          <div className="space-y-2">
            {safeArray(imbalance.class_distribution).map((cls, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-32 truncate text-sm font-medium">
                  {cls.class}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${cls.percentage}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {cls.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-24 text-right text-sm text-gray-600">
                  {cls.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {imbalance.task_type === "regression" && (
        <div>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="font-semibold text-blue-900 mb-2">
              Regression Target Detected
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mean:</span>
                <span className="font-medium ml-2">
                  {imbalance.statistics?.mean}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Median:</span>
                <span className="font-medium ml-2">
                  {imbalance.statistics?.median}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Std Dev:</span>
                <span className="font-medium ml-2">
                  {imbalance.statistics?.std}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Min:</span>
                <span className="font-medium ml-2">
                  {imbalance.statistics?.min}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Max:</span>
                <span className="font-medium ml-2">
                  {imbalance.statistics?.max}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Range:</span>
                <span className="font-medium ml-2">
                  {imbalance.statistics?.range}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${
                imbalance.distribution?.skewness_flag === "high"
                  ? "bg-red-50 border border-red-200"
                  : imbalance.distribution?.skewness_flag === "moderate"
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Skewness</p>
              <p className="text-2xl font-bold">
                {imbalance.distribution?.skewness}
              </p>
              <p className="text-xs capitalize mt-1">
                {imbalance.distribution?.skewness_flag}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Outliers</p>
              <p className="text-2xl font-bold text-orange-600">
                {imbalance.outliers?.percentage}%
              </p>
              <p className="text-xs mt-1">
                {imbalance.outliers?.count} outliers detected
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
