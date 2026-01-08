import { Award, CheckCircle } from "lucide-react";
import { safeArray } from "../utils/helpers";

export default function Recommendations({ recommendations }) {
  if (!safeArray(recommendations).length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-8 h-8 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">💡 Recommendations</h3>
      </div>
      <div className="space-y-4">
        {safeArray(recommendations).map((rec, idx) => (
          <div
            key={idx}
            className="p-5 bg-blue-50 border-2 border-blue-200 rounded-lg"
          >
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-lg text-gray-900">
                    {rec.category}
                  </p>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${
                      rec.priority === "high"
                        ? "bg-red-200 text-red-800"
                        : rec.priority === "medium"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                </div>
                {safeArray(rec.actions).length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Recommended Actions:
                    </p>
                    <ul className="space-y-1.5">
                      {safeArray(rec.actions).map((action, aidx) => (
                        <li
                          key={aidx}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <span className="text-blue-600 font-bold mt-0.5">
                            •
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
