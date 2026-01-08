import { Upload, FileText, AlertCircle } from "lucide-react";
import { formatBytes } from "../utils/helpers";

export default function FileUpload({
  file,
  targetColumn,
  uploading,
  analyzing,
  error,
  onFileChange,
  onDrop,
  onDragOver,
  onTargetChange,
  onUpload,
  onReset,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-4 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-indigo-50"
      >
        <input
          type="file"
          accept=".csv"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports CSV files for comprehensive health analysis
          </p>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {file && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-600">
                {formatBytes(file.size)} KB
              </p>
            </div>
            <button
              onClick={onReset}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Column <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={targetColumn}
              onChange={onTargetChange}
              placeholder="e.g., price, target, label, outcome"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <strong>Required:</strong> Specify your target/outcome column for
              leakage detection and baseline modeling
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onUpload}
        disabled={!file || uploading || !targetColumn.trim()}
        className="w-full mt-6 bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
      >
        {uploading
          ? "Uploading..."
          : analyzing
          ? "Analyzing..."
          : "Analyze CSV"}
      </button>

      {(uploading || analyzing) && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {uploading
                ? "Uploading file..."
                : "Running comprehensive ML-ready analysis..."}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-indigo-600 h-3 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
