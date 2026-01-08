import { Database } from "lucide-react";
import { safeGet } from "../utils/helpers";

export default function ColumnTypes({ profile }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Column Type Distribution
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Numeric</p>
          <p className="text-2xl font-bold text-blue-600">
            {safeGet(profile, "column_types.numeric", 0)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Categorical</p>
          <p className="text-2xl font-bold text-green-600">
            {safeGet(profile, "column_types.categorical", 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Datetime</p>
          <p className="text-2xl font-bold text-purple-600">
            {safeGet(profile, "column_types.datetime", 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
