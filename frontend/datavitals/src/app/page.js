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
  Shield,
  Target,
  TrendingUp,
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

    // Validate target column is provided
    if (!targetColumn.trim()) {
      setError(
        "Please specify a target column for comprehensive analysis including leakage detection and baseline modeling"
      );
      return;
    }

    setUploading(true);
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target_column", targetColumn.trim());

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

  const getRiskColor = (risk) => {
    if (risk === "critical") return "bg-red-100 text-red-700 border-red-300";
    if (risk === "high")
      return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-yellow-100 text-yellow-700 border-yellow-300";
  };

  const getOverfittingColor = (severity) => {
    if (severity === "severe") return "bg-red-50 border-red-300 text-red-800";
    if (severity === "moderate")
      return "bg-yellow-50 border-yellow-300 text-yellow-800";
    if (severity === "mild")
      return "bg-orange-50 border-orange-300 text-orange-800";
    return "bg-green-50 border-green-300 text-green-800";
  };

  // Safe access helpers
  const safeGet = (obj, path, defaultValue = 0) =>
    path.split(".").reduce((acc, key) => acc?.[key], obj) ?? defaultValue;

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
            Upload your CSV file with target column for comprehensive ML-ready
            analysis
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
                    Target Column <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    placeholder="e.g., price, target, label, outcome"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Required:</strong> Specify your target/outcome
                    column for leakage detection and baseline modeling
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
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

            {/* Leakage Detection - PHASE 3 */}
            {insights?.leakage?.exists && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-red-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      🔥 Data Leakage Detection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Critical analysis to identify features that may leak
                      target information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-600 mb-1">
                      Critical Leakage
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {safeGet(insights, "leakage.summary.critical_leakage", 0)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">High Risk</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {safeGet(
                        insights,
                        "leakage.summary.high_risk_leakage",
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">
                      Features Analyzed
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {safeGet(
                        insights,
                        "leakage.summary.total_features_analyzed",
                        0
                      )}
                    </p>
                  </div>
                </div>

                {safeArray(insights?.leakage?.leakage_features).length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      ⚠️ Suspicious Features
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {safeArray(insights.leakage.leakage_features).map(
                        (feat, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${getRiskColor(
                              feat.risk
                            )}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-bold text-lg">
                                  {feat.feature}
                                </span>
                                <span
                                  className={`ml-3 text-xs px-2 py-1 rounded font-semibold uppercase ${getRiskColor(
                                    feat.risk
                                  )}`}
                                >
                                  {feat.risk} RISK
                                </span>
                              </div>
                              <span className="text-xl font-bold">
                                {(feat.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm">
                              Detection Method:{" "}
                              <span className="font-medium">
                                {feat.method.replace(/_/g, " ")}
                              </span>
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {safeArray(insights?.leakage?.correlation_analysis).length >
                  0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Top Feature-Target Correlations
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {safeArray(insights.leakage.correlation_analysis).map(
                        (corr, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="font-medium text-gray-900 flex-1">
                              {corr.feature}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${corr.correlation * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-16 text-right">
                              {(corr.correlation * 100).toFixed(1)}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Baseline Model - PHASE 3 */}
            {insights?.baseline?.exists && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      🎯 Baseline Model Performance
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sanity check using {insights.baseline.model}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {insights.baseline.task_type === "classification" ? (
                    <>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Train Accuracy
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {(
                            safeGet(
                              insights,
                              "baseline.metrics.train_accuracy",
                              0
                            ) * 100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Test Accuracy
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(
                            safeGet(
                              insights,
                              "baseline.metrics.test_accuracy",
                              0
                            ) * 100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      {safeGet(insights, "baseline.metrics.test_auc") && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Test AUC</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {(
                              safeGet(
                                insights,
                                "baseline.metrics.test_auc",
                                0
                              ) * 100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      )}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Accuracy Gap
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {(
                            safeGet(
                              insights,
                              "baseline.metrics.accuracy_gap",
                              0
                            ) * 100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Train R²</p>
                        <p className="text-2xl font-bold text-green-600">
                          {safeGet(
                            insights,
                            "baseline.metrics.train_r2",
                            0
                          ).toFixed(3)}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Test R²</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {safeGet(
                            insights,
                            "baseline.metrics.test_r2",
                            0
                          ).toFixed(3)}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Test RMSE</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {safeGet(
                            insights,
                            "baseline.metrics.test_rmse",
                            0
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">R² Gap</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {safeGet(
                            insights,
                            "baseline.metrics.r2_gap",
                            0
                          ).toFixed(3)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div
                  className={`p-4 rounded-lg border-2 mb-6 ${getOverfittingColor(
                    insights.baseline.overfitting?.severity
                  )}`}
                >
                  <p className="font-semibold text-lg mb-1">
                    Overfitting Assessment:{" "}
                    <span className="uppercase">
                      {insights.baseline.overfitting?.severity}
                    </span>
                  </p>
                  <p className="text-sm">
                    Performance gap between train and test:{" "}
                    {(
                      safeGet(insights, "baseline.overfitting.gap", 0) * 100
                    ).toFixed(2)}
                    %
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Noise Estimate</p>
                    <p className="text-xl font-bold text-gray-900">
                      {(
                        safeGet(insights, "baseline.noise_estimate", 0) * 100
                      ).toFixed(1)}
                      %
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated data noise level
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Data Split</p>
                    <p className="text-xl font-bold text-gray-900">
                      {safeGet(insights, "baseline.data_split.train_size", 0)} /{" "}
                      {safeGet(insights, "baseline.data_split.test_size", 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Train / Test samples
                    </p>
                  </div>
                </div>

                {safeArray(insights?.baseline?.feature_importance).length >
                  0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      <TrendingUp className="w-5 h-5 inline mr-2" />
                      Top 10 Important Features
                    </h4>
                    <div className="space-y-2">
                      {safeArray(insights.baseline.feature_importance).map(
                        (feat, idx) => (
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
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {insights?.distribution && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-8 h-8 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Distribution & Outlier Analysis
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Features</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {safeGet(
                        insights,
                        "distribution.summary.total_analyzed",
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Skewed Features
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {safeGet(
                        insights,
                        "distribution.summary.skewed_features",
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Outlier Features
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {safeGet(
                        insights,
                        "distribution.summary.outlier_features",
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Dominated Cat.</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {safeGet(
                        insights,
                        "distribution.summary.dominated_categorical",
                        0
                      )}
                    </p>
                  </div>
                </div>

                {safeArray(insights?.distribution?.numeric_features).length >
                  0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Numeric Feature Distributions
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {safeArray(insights.distribution.numeric_features).map(
                        (feat, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">
                                {feat.column || "Unknown"}
                              </span>
                              <div className="flex gap-2">
                                {feat.skewness_flag !== "low" && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      feat.skewness_flag === "high"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {feat.skewness_flag} skew
                                  </span>
                                )}
                                {feat.outlier_percentage > 5 && (
                                  <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                                    {feat.outlier_percentage}% outliers
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
                              <div>
                                Mean: {feat.statistics?.mean?.toFixed(2)}
                              </div>
                              <div>
                                Median: {feat.statistics?.median?.toFixed(2)}
                              </div>
                              <div>Std: {feat.statistics?.std?.toFixed(2)}</div>
                              <div>Skew: {feat.skewness?.toFixed(2)}</div>
                              <div>Outliers: {feat.outliers?.count || 0}</div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {safeArray(insights?.distribution?.categorical_features)
                  .length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Categorical Feature Distributions
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {safeArray(
                        insights.distribution.categorical_features
                      ).map((feat, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-gray-900">
                              {feat.column || "Unknown"}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                              {feat.cardinality} unique
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Dominant:{" "}
                            <span className="font-medium">
                              {feat.dominant_category?.value}
                            </span>{" "}
                            ({feat.dominant_category?.percentage}%)
                          </div>
                          <div className="space-y-1">
                            {safeArray(feat.top_categories).map((cat, cidx) => (
                              <div
                                key={cidx}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div className="w-24 truncate">{cat.value}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-indigo-500 h-2 rounded-full"
                                    style={{ width: `${cat.percentage}%` }}
                                  />
                                </div>
                                <div className="w-12 text-right text-gray-600">
                                  {cat.percentage}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {insights?.imbalance?.exists && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-8 h-8 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Target Variable Analysis
                  </h3>
                </div>

                {insights.imbalance.task_type === "classification" && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Task Type</p>
                        <p className="text-lg font-bold text-purple-600 capitalize">
                          {insights.imbalance.classification_type}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Classes</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {insights.imbalance.n_classes}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Majority</p>
                        <p className="text-2xl font-bold text-green-600">
                          {insights.imbalance.imbalance?.majority_percentage}%
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Imbalance Ratio
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {insights.imbalance.imbalance?.ratio}:1
                        </p>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg mb-6 ${
                        insights.imbalance.imbalance?.severity === "severe"
                          ? "bg-red-50 border border-red-200"
                          : insights.imbalance.imbalance?.severity ===
                            "moderate"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-green-50 border border-green-200"
                      }`}
                    >
                      <p className="font-semibold mb-1">
                        Imbalance Severity:{" "}
                        <span className="capitalize">
                          {insights.imbalance.imbalance?.severity}
                        </span>
                      </p>
                      <p className="text-sm">
                        Majority class:{" "}
                        <span className="font-medium">
                          {insights.imbalance.imbalance?.majority_class}
                        </span>{" "}
                        ({insights.imbalance.imbalance?.majority_count} samples)
                        {" • "}
                        Minority class:{" "}
                        <span className="font-medium">
                          {insights.imbalance.imbalance?.minority_class}
                        </span>{" "}
                        ({insights.imbalance.imbalance?.minority_count} samples)
                      </p>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-3">
                      Class Distribution
                    </h4>
                    <div className="space-y-2">
                      {safeArray(insights.imbalance.class_distribution).map(
                        (cls, idx) => (
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
                        )
                      )}
                    </div>
                  </div>
                )}

                {insights.imbalance.task_type === "regression" && (
                  <div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="font-semibold text-blue-900 mb-2">
                        Regression Target Detected
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Mean:</span>
                          <span className="font-medium ml-2">
                            {insights.imbalance.statistics?.mean}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Median:</span>
                          <span className="font-medium ml-2">
                            {insights.imbalance.statistics?.median}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Std Dev:</span>
                          <span className="font-medium ml-2">
                            {insights.imbalance.statistics?.std}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Min:</span>
                          <span className="font-medium ml-2">
                            {insights.imbalance.statistics?.min}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Max:</span>
                          <span className="font-medium ml-2">
                            {insights.imbalance.statistics?.max}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Range:</span>
                          <span className="font-medium ml-2">
                            {insights.imbalance.statistics?.range}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div
                        className={`p-4 rounded-lg ${
                          insights.imbalance.distribution?.skewness_flag ===
                          "high"
                            ? "bg-red-50 border border-red-200"
                            : insights.imbalance.distribution?.skewness_flag ===
                              "moderate"
                            ? "bg-yellow-50 border border-yellow-200"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <p className="text-sm text-gray-600 mb-1">Skewness</p>
                        <p className="text-2xl font-bold">
                          {insights.imbalance.distribution?.skewness}
                        </p>
                        <p className="text-xs capitalize mt-1">
                          {insights.imbalance.distribution?.skewness_flag}
                        </p>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-gray-600 mb-1">Outliers</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {insights.imbalance.outliers?.percentage}%
                        </p>
                        <p className="text-xs mt-1">
                          {insights.imbalance.outliers?.count} outliers detected
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
