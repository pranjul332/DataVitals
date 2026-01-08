import { Layers } from "lucide-react";
import { safeArray } from "../utils/helpers";

export default function FeatureQuality({ features }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Layers className="w-8 h-8 text-indigo-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Feature Quality Assessment
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Constant</p>
          <p className="text-2xl font-bold text-red-600">
            {safeArray(features?.constant_features).length}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Near-Constant</p>
          <p className="text-2xl font-bold text-orange-600">
            {safeArray(features?.near_constant_features).length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">High Cardinality</p>
          <p className="text-2xl font-bold text-yellow-600">
            {safeArray(features?.high_cardinality_features).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Redundant Features</p>
          <p className="text-2xl font-bold text-purple-600">
            {safeArray(features?.redundant_features).length}
          </p>
        </div>
      </div>

      {features?.summary && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-blue-900 mb-3">
            Summary Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Total Features:</span>
              <span className="font-medium ml-2">
                {features.summary.total_features}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Usable Features:</span>
              <span className="font-medium ml-2">
                {features.summary.usable_features}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Features to Drop:</span>
              <span className="font-medium ml-2">
                {features.summary.features_to_drop}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Feature Quality:</span>
              <span className="font-medium ml-2">
                {features.summary.feature_quality_percentage?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {safeArray(features?.constant_features).length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">
              Constant Features
            </h4>
            <div className="flex flex-wrap gap-2">
              {safeArray(features.constant_features).map((col, idx) => (
                <span
                  key={idx}
                  className="bg-white px-3 py-1 rounded text-sm text-gray-700 border border-red-200"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {safeArray(features?.near_constant_features).length > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">
              Near-Constant Features
            </h4>
            <div className="space-y-2">
              {safeArray(features.near_constant_features).map((item, idx) => (
                <div
                  key={idx}
                  className="text-sm bg-white p-2 rounded border border-orange-200"
                >
                  <span className="font-medium">
                    {item.column || "Unknown"}
                  </span>
                  <span className="text-gray-600">
                    {" "}
                    - {(item.unique_ratio || 0).toFixed(2)}% unique
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {safeArray(features?.high_cardinality_features).length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">
              High Cardinality Features
            </h4>
            <div className="space-y-2">
              {safeArray(features.high_cardinality_features).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="text-sm bg-white p-2 rounded border border-yellow-200"
                  >
                    <span className="font-medium">
                      {item.column || "Unknown"}
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      - {(item.unique_values || 0).toLocaleString()} unique
                      values
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {safeArray(features?.redundant_features).length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">
              Redundant Feature Pairs
            </h4>
            <div className="space-y-2">
              {safeArray(features.redundant_features).map((pair, idx) => (
                <div
                  key={idx}
                  className="text-sm bg-white p-2 rounded border border-purple-200"
                >
                  <span className="font-medium">
                    {pair.column1 || "Unknown"}
                  </span>
                  <span className="text-gray-600"> ↔ </span>
                  <span className="font-medium">
                    {pair.column2 || "Unknown"}
                  </span>
                  <span className="text-gray-600">
                    {" "}
                    (correlation: {(pair.correlation || 0).toFixed(3)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
