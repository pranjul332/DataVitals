"use client"
import React, { useState } from "react";
import {
  Upload,
  FileText,
  TrendingUp,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function CSVInsightsApp() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
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
    if (droppedFile && droppedFile.type === "text/csv") {
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

    // Simulate upload and analysis
    // TODO: Replace with actual backend API call
    setTimeout(() => {
      setUploading(false);
      setTimeout(() => {
        setAnalyzing(false);
        setInsights({
          rows: 1250,
          columns: 8,
          summary:
            "Your CSV data has been analyzed successfully. Insights will be generated here.",
          keyFindings: [
            "Total records processed: 1,250",
            "Data quality score: 94%",
            "Missing values detected: 2.3%",
            "Outliers identified: 15 records",
          ],
        });
      }, 2000);
    }, 1500);
  };

  const resetUpload = () => {
    setFile(null);
    setInsights(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CSV Insights Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your CSV file to get deep analytical insights
          </p>
        </div>

        {!insights ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-3 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-indigo-50/50"
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
                  Supports CSV files up to 50MB
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
                    {uploading ? "Uploading file..." : "Analyzing data..."}
                  </span>
                  <span>{uploading ? "60%" : "80%"}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: uploading ? "60%" : "80%" }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Analysis Complete
                </h2>
                <p className="text-gray-600">File: {file.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                <p className="text-3xl font-bold text-blue-600">
                  {insights.rows}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Columns</p>
                <p className="text-3xl font-bold text-purple-600">
                  {insights.columns}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Summary
              </h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {insights.summary}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Key Findings
              </h3>
              <ul className="space-y-2">
                {insights.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={resetUpload}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
