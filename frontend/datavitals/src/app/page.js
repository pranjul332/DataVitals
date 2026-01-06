"use client";
import { useState } from "react";
import {
  Upload,
  FileText,
  BarChart3,
  AlertCircle,
  Database,
  AlertTriangle,
  CheckCircle,
  Layers,
} from "lucide-react";

export default function Component() {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid CSV file");
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid CSV file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (targetColumn.trim()) {
        formData.append("target_column", targetColumn.trim());
      }

      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setUploading(false);
      setAnalyzing(false);

      if (data.success) {
        setInsights(data.report);
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch (err) {
      setUploading(false);
      setAnalyzing(false);
      setError(
        `Failed to connect: ${err.message}. Make sure Flask server is running on port 5000.`
      );
    }
  };

  const resetUpload = () => {
    setFile(null);
    setInsights(null);
    setError(null);
    setTargetColumn("");
  };

  const getSeverityColor = (severity) => {
    if (severity === "high") return "text-red-600 bg-red-50";
    if (severity === "medium") return "text-yellow-600 bg-yellow-50";
    if (severity === "low") return "text-green-600 bg-green-50";
    return "text-gray-600 bg-gray-50";
  };

  // Safe access helpers
  const safeGet = (obj, path, defaultValue = 0) => {
    try {
      return (
        path.split(".").reduce((acc, part) => acc?.[part], obj) ?? defaultValue
      );
    } catch {
      return defaultValue;
    }
  };

  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CSV Data Health Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your CSV file to get comprehensive data quality insights
          </p>
        </div>

        {!insights ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-4 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-indigo-50"
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
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
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Column (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    placeholder="e.g., price, target, label"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Specify the target/outcome column for additional analysis
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
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
                      : "Running comprehensive analysis..."}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-600 h-3 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analysis Complete
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {safeGet(
                      insights,
                      "profile.shape.rows",
                      0
                    ).toLocaleString()}
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
                    {safeGet(
                      insights,
                      "profile.duplicates.percentage",
                      0
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              </div>
            </div>

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
                    {safeGet(
                      insights,
                      "profile.missing.missing_percentage",
                      0
                    ).toFixed(2)}
                    %
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Columns Affected</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {safeGet(
                      insights,
                      "missing.summary.columns_with_missing",
                      0
                    )}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">High Severity</p>
                  <p className="text-2xl font-bold text-red-600">
                    {safeGet(
                      insights,
                      "missing.summary.columns_high_missing",
                      0
                    )}
                  </p>
                </div>
              </div>

              {safeArray(insights?.missing?.columns).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Columns with Missing Values
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {safeArray(insights.missing.columns).map((col, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${getSeverityColor(
                          col.severity
                        )}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {col.column || "Unknown"}
                          </span>
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
            </div>

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
                    {safeArray(insights?.features?.constant_features).length}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Near-Constant</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {
                      safeArray(insights?.features?.near_constant_features)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">High Cardinality</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      safeArray(insights?.features?.high_cardinality_features)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Redundant Pairs</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {safeGet(insights, "features.summary.redundant_pairs", 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {safeArray(insights?.features?.constant_features).length >
                  0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">
                      Constant Features
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {safeArray(insights.features.constant_features).map(
                        (col, idx) => (
                          <span
                            key={idx}
                            className="bg-white px-3 py-1 rounded text-sm text-gray-700"
                          >
                            {col}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {safeArray(insights?.features?.near_constant_features).length >
                  0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">
                      Near-Constant Features
                    </h4>
                    <div className="space-y-2">
                      {safeArray(insights.features.near_constant_features).map(
                        (item, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">
                              {item.column || "Unknown"}
                            </span>
                            <span className="text-gray-600">
                              {" "}
                              - {(item.unique_ratio || 0).toFixed(2)}% unique
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {safeArray(insights?.features?.high_cardinality_features)
                  .length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">
                      High Cardinality Features
                    </h4>
                    <div className="space-y-2">
                      {safeArray(
                        insights.features.high_cardinality_features
                      ).map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">
                            {item.column || "Unknown"}
                          </span>
                          <span className="text-gray-600">
                            {" "}
                            - {(item.unique_values || 0).toLocaleString()}{" "}
                            unique
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {safeArray(insights?.features?.redundant_pairs).length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">
                      Redundant Feature Pairs
                    </h4>
                    <div className="space-y-2">
                      {safeArray(insights.features.redundant_pairs).map(
                        (pair, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">
                              {pair.column1 || "Unknown"}
                            </span>
                            <span className="text-gray-600"> ↔ </span>
                            <span className="font-medium">
                              {pair.column2 || "Unknown"}
                            </span>
                            <span className="text-gray-600">
                              {" "}
                              ({(pair.correlation || 0).toFixed(2)})
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                    {safeGet(insights, "profile.column_types.numeric", 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Categorical</p>
                  <p className="text-2xl font-bold text-green-600">
                    {safeGet(insights, "profile.column_types.categorical", 0)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Datetime</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {safeGet(insights, "profile.column_types.datetime", 0)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={resetUpload}
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
