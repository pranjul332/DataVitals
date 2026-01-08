import { Target, TrendingUp } from "lucide-react";
import { safeGet, safeArray, getOverfittingColor } from "../utils/helpers";

export default function BaselineModel({ baseline }) {
  if (!baseline?.exists) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8 text-green-600" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            🎯 Baseline Model Performance
          </h3>
          <p className="text-sm text-gray-600">
            Sanity check using {baseline.model}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {baseline.task_type === "classification" ? (
          <>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Train Accuracy</p>
              <p className="text-2xl font-bold text-green-600">
                {(safeGet(baseline, "metrics.train_accuracy", 0) * 100).toFixed(
                  1
                )}
                %
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Test Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">
                {(safeGet(baseline, "metrics.test_accuracy", 0) * 100).toFixed(
                  1
                )}
                %
              </p>
            </div>
            {safeGet(baseline, "metrics.test_auc") && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Test AUC</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(safeGet(baseline, "metrics.test_auc", 0) * 100).toFixed(1)}%
                </p>
              </div>
            )}
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Accuracy Gap</p>
              <p className="text-2xl font-bold text-orange-600">
                {(safeGet(baseline, "metrics.accuracy_gap", 0) * 100).toFixed(
                  1
                )}
                %
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Train R²</p>
              <p className="text-2xl font-bold text-green-600">
                {safeGet(baseline, "metrics.train_r2", 0).toFixed(3)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Test R²</p>
              <p className="text-2xl font-bold text-blue-600">
                {safeGet(baseline, "metrics.test_r2", 0).toFixed(3)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Test RMSE</p>
              <p className="text-2xl font-bold text-purple-600">
                {safeGet(baseline, "metrics.test_rmse", 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">R² Gap</p>
              <p className="text-2xl font-bold text-orange-600">
                {safeGet(baseline, "metrics.r2_gap", 0).toFixed(3)}
              </p>
            </div>
          </>
        )}
      </div>

      <div
        className={`p-4 rounded-lg border-2 mb-6 ${getOverfittingColor(
          baseline.overfitting?.severity
        )}`}
      >
        <p className="font-semibold text-lg mb-1">
          Overfitting Assessment:{" "}
          <span className="uppercase">{baseline.overfitting?.severity}</span>
        </p>
        <p className="text-sm">
          Performance gap between train and test:{" "}
          {(safeGet(baseline, "overfitting.gap", 0) * 100).toFixed(2)}%
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Noise Estimate</p>
          <p className="text-xl font-bold text-gray-900">
            {(safeGet(baseline, "noise_estimate", 0) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Estimated data noise level
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Data Split</p>
          <p className="text-xl font-bold text-gray-900">
            {safeGet(baseline, "data_split.train_size", 0)} /{" "}
            {safeGet(baseline, "data_split.test_size", 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Train / Test samples</p>
        </div>
      </div>

      {safeArray(baseline?.feature_importance).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Top 10 Important Features
          </h4>
          <div className="space-y-2">
            {safeArray(baseline.feature_importance).map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
              >
                <span className="text-sm font-bold text-gray-500 w-6">
                  #{idx + 1}
                </span>
                <span className="font-medium text-gray-900 flex-1">
                  {feat.feature}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${feat.importance * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-16 text-right">
                  {(feat.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
