import { AlertOctagon } from "lucide-react";
import { safeArray } from "../utils/helpers";

export default function TopRisks({ risks }) {
  if (!safeArray(risks).length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
      <div className="flex items-center gap-3 mb-6">
        <AlertOctagon className="w-8 h-8 text-red-600" />
        <h3 className="text-xl font-bold text-gray-900">
          🚨 Top Risks Detected
        </h3>
      </div>
      <div className="space-y-4">
        {safeArray(risks).map((risk, idx) => (
          <div
            key={idx}
            className="p-5 bg-red-50 border-2 border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    #{risk.priority || idx + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-lg text-gray-900">
                    {risk.title || risk.issue}
                  </h4>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                        risk.severity === "critical"
                          ? "bg-red-600 text-white"
                          : risk.severity === "high"
                          ? "bg-orange-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
                {risk.impact && (
                  <p className="text-sm text-red-700 font-medium mb-2">
                    <span className="font-bold">Impact:</span> {risk.impact}
                  </p>
                )}
                {risk.action && (
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      💡 Recommended Action:
                    </p>
                    <p className="text-sm text-gray-700">{risk.action}</p>
                  </div>
                )}
                {risk.type && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 font-mono inline-block mt-2">
                    Type: {risk.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
