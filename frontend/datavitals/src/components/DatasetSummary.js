import { Database } from "lucide-react";

export default function DatasetSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-indigo-600" />
        <h3 className="text-xl font-bold text-gray-900">📊 Dataset Summary</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Analysis Phase</p>
          <p className="text-lg font-bold text-indigo-600 capitalize">
            {summary.analysis_phase}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Dataset Shape</p>
          <p className="text-lg font-bold text-blue-600">
            {summary.dataset_shape?.rows?.toLocaleString()} ×{" "}
            {summary.dataset_shape?.columns}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Memory Usage</p>
          <p className="text-lg font-bold text-purple-600">
            {summary.memory_usage?.mb?.toFixed(2)} MB
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Missing Data</p>
          <p className="text-lg font-bold text-yellow-600">
            {summary.missing_percentage?.toFixed(2)}%
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Duplicates</p>
          <p className="text-lg font-bold text-orange-600">
            {summary.duplicate_percentage?.toFixed(2)}%
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Target Column</p>
          <p className="text-lg font-bold text-green-600">
            {summary.has_target ? "✓ Provided" : "✗ Missing"}
          </p>
        </div>
      </div>
    </div>
  );
}
