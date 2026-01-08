"use client";
import { useState } from "react";
import { BarChart3 } from "lucide-react";

// Import all components
import FileUpload from "../components/FileUpload";
import HealthScore from "../components/HealthScore";
import TopRisks from "../components/TopRisks";
import DatasetSummary from "../components/DatasetSummary";
import Recommendations from "../components/Recommendations";
import LeakageDetection from "../components/LeakageDetection";
import BaselineModel from "../components/BaselineModel";
import MissingValueAnalysis from "../components/MissingValueAnalysis";
import FeatureQuality from "../components/FeatureQuality";
import ColumnTypes from "../components/ColumnTypes";
import DistributionAnalysis from "../components/DistributionAnalysis";
import TargetAnalysis from "../components/TargetAnalysis";

export default function App() {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [response, setResponse] = useState(null);
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

      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setUploading(false);
      setAnalyzing(false);

      if (data.success) {
        setResponse(data);
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
    setResponse(null);
    setError(null);
    setTargetColumn("");
  };

  const insights = response?.detailed_analysis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 text-black">
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

        {!response ? (
          <FileUpload
            file={file}
            targetColumn={targetColumn}
            uploading={uploading}
            analyzing={analyzing}
            error={error}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onTargetChange={(e) => setTargetColumn(e.target.value)}
            onUpload={handleUpload}
            onReset={resetUpload}
          />
        ) : (
          <div className="space-y-6">
            <HealthScore response={response} insights={insights} />
            <TopRisks risks={response.top_risks} />
            <DatasetSummary summary={response.summary} />
            <Recommendations recommendations={response.recommendations} />
            <LeakageDetection leakage={insights?.leakage} />
            <BaselineModel baseline={insights?.baseline} />
            <MissingValueAnalysis
              missing={insights?.missing}
              profile={insights?.profile}
            />
            <FeatureQuality features={insights?.features} />
            <ColumnTypes profile={insights?.profile} />
            <DistributionAnalysis distribution={insights?.distribution} />
            <TargetAnalysis imbalance={insights?.imbalance} />

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
