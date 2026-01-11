"use client";
import { useState, useEffect } from "react";
import { BarChart3, Lock } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

// Import all components
import FileUpload from "../../../components/FileUpload";
import HealthScore from "../../../components/HealthScore";
import TopRisks from "../../../components/TopRisks";
import DatasetSummary from "../../../components/DatasetSummary";
import Recommendations from "../../../components/Recommendations";
import LeakageDetection from "../../../components/LeakageDetection";
import BaselineModel from "../../../components/BaselineModel";
import MissingValueAnalysis from "../../../components/MissingValueAnalysis";
import FeatureQuality from "../../../components/FeatureQuality";
import ColumnTypes from "../../../components/ColumnTypes";
import DistributionAnalysis from "../../../components/DistributionAnalysis";
import TargetAnalysis from "../../../components/TargetAnalysis";

export default function App() {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  // Get auth token when user is authenticated
  useEffect(() => {
    const getToken = async () => {
      if (!isAuthenticated) {
        setAuthToken(null);
        return;
      }

      try {
        setTokenLoading(true);
        console.log("🔑 Fetching access token...");

        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        setAuthToken(token);
        console.log("✅ Token obtained:", token.substring(0, 30) + "...");
      } catch (error) {
        console.error("❌ Error getting token:", error);
        setAuthToken(null);
      } finally {
        setTokenLoading(false);
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Debug auth state
  useEffect(() => {
    console.log("🔍 App component auth state:", {
      isAuthenticated,
      hasToken: !!authToken,
      tokenLoading,
      tokenPreview: authToken?.substring(0, 20),
      userId: user?.sub,
    });
  }, [isAuthenticated, authToken, tokenLoading, user]);

  // Helper function to get auth headers
  // IMPORTANT: Don't set Content-Type for FormData - browser will set it automatically with boundary
  const getAuthHeaders = () => {
    const headers = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
      console.log("✅ Adding Authorization header to request");
    } else {
      console.warn("⚠️ No authToken available for request");
    }
    if (user?.sub) {
      headers["X-User-Id"] = user.sub;
    }
    // DO NOT add Content-Type here - it will break FormData
    return headers;
  };

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

    // Check authentication before upload
    if (!isAuthenticated || !authToken) {
      setError(
        "Please sign in to analyze datasets. If you just signed in, please wait a moment for the session to initialize."
      );
      console.error("❌ Upload blocked - not authenticated:", {
        isAuthenticated,
        hasToken: !!authToken,
      });
      return;
    }

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

      const headers = getAuthHeaders();
      console.log("📤 Sending request with headers:", Object.keys(headers));

      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: headers,
        body: formData,
      });

      console.log("📥 Response status:", res.status);
      const data = await res.json();
      console.log("📥 Response data:", data);

      setUploading(false);
      setAnalyzing(false);

      // Handle authentication errors
      if (res.status === 401) {
        setError(
          data.message ||
            "Authentication required. Please sign in to analyze datasets."
        );
        console.error("❌ 401 Unauthorized:", data);
        return;
      }

      if (data.success) {
        setResponse(data);
        console.log("✅ Analysis successful");
      } else {
        setError(data.error || "Analysis failed");
        console.error("❌ Analysis failed:", data);
      }
    } catch (err) {
      setUploading(false);
      setAnalyzing(false);
      setError(
        `Failed to connect: ${err.message}. Make sure Flask server is running on port 8000.`
      );
      console.error("❌ Request failed:", err);
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

          {/* Authentication Status */}
          {!isAuthenticated && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">
                Please sign in to analyze datasets
              </span>
            </div>
          )}

          {isAuthenticated && tokenLoading && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800 font-medium">
                Initializing session...
              </span>
            </div>
          )}

          {isAuthenticated && !tokenLoading && authToken && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-800 font-medium">
                Authenticated and ready
              </span>
            </div>
          )}

          {isAuthenticated && !tokenLoading && !authToken && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <Lock className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">
                Authentication error - please try signing in again
              </span>
            </div>
          )}
        </div>

        {!response ? (
          <FileUpload
            file={file}
            targetColumn={targetColumn}
            uploading={uploading}
            analyzing={analyzing}
            error={error}
            isAuthenticated={isAuthenticated && !!authToken}
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
