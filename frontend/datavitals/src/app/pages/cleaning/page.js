"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Upload,
  FileText,
  Zap,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Settings,
  BarChart,
  Lock,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function DataPrepEngine() {
  const [step, setStep] = useState("upload");
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [filename, setFilename] = useState("");
  const [taskType, setTaskType] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [plan, setPlan] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supportedTasks, setSupportedTasks] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [dryRunResult, setDryRunResult] = useState(null);
  const fileInputRef = useRef(null);

  // Auth state
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [authToken, setAuthToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Get auth token when user is authenticated
  useEffect(() => {
    const getToken = async () => {
      if (!isAuthenticated) {
        setAuthToken(null);
        return;
      }

      try {
        setTokenLoading(true);
        console.log("🔑 [DataPrep] Fetching access token...");

        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        setAuthToken(token);
        console.log("✅ [DataPrep] Token obtained");
      } catch (error) {
        console.error("❌ [DataPrep] Error getting token:", error);
        setAuthToken(null);
      } finally {
        setTokenLoading(false);
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Helper function to get auth headers
  const getAuthHeaders = (includeContentType = true) => {
    const headers = {};
    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
      console.log("✅ [DataPrep] Adding Authorization header");
    } else {
      console.warn("⚠️ [DataPrep] No authToken available");
    }
    if (user?.sub) {
      headers["X-User-Id"] = user.sub;
    }
    return headers;
  };

  const fetchSupportedTasks = async () => {
    if (!isAuthenticated || !authToken) {
      console.log("⏭️ [DataPrep] Skipping task fetch - not authenticated");
      // Set default tasks
      setSupportedTasks({
        tasks: [
          "regression",
          "binary_classification",
          "multiclass_classification",
          "clustering",
          "time_series",
          "anomaly_detection",
        ],
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication required. Please sign in.");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setSupportedTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      // Fallback to default tasks
      setSupportedTasks({
        tasks: [
          "regression",
          "binary_classification",
          "multiclass_classification",
          "clustering",
          "time_series",
          "anomaly_detection",
        ],
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchSupportedTasks();
    }
  }, [isAuthenticated, authToken]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check authentication
    if (!isAuthenticated || !authToken) {
      setError(
        "Please sign in to use the data preparation engine. If you just signed in, please wait a moment."
      );
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const headers = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      if (user?.sub) {
        headers["X-User-Id"] = user.sub;
      }
      // Don't set Content-Type for FormData

      console.log("📤 [DataPrep] Uploading file...");
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        throw new Error(data.error || "Upload failed");
      }

      setSessionId(data.session_id);
      setProfile(data.profile);
      setFilename(data.filename);
      setStep("configure");
      console.log("✅ [DataPrep] Upload successful");
    } catch (err) {
      setError(err.message);
      console.error("❌ [DataPrep] Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!isAuthenticated || !authToken) {
      setError("Authentication required. Please sign in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/plan`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          task_type: taskType,
          target_column: targetColumn || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        if (data.validation_errors) {
          throw new Error(data.error || "Plan generation failed");
        }
        throw new Error(data.error || "Plan generation failed");
      }

      setPlan(data.plan);
      setStep("review");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDryRun = async () => {
    if (!isAuthenticated || !authToken) {
      setError("Authentication required. Please sign in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/dry-run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          plan: plan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        throw new Error(data.error || "Dry run failed");
      }

      setDryRunResult(data.estimated_impact);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!isAuthenticated || !authToken) {
      setError("Authentication required. Please sign in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/execute`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          plan: plan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        throw new Error(data.error || "Execution failed");
      }

      setExecutionResult(data);
      setReport(data.report);
      setStep("results");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (!isAuthenticated || !authToken) {
      setError("Authentication required. Please sign in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/regenerate-plan`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          feedback: feedback,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        throw new Error(data.error || "Plan regeneration failed");
      }

      setPlan(data.plan);
      setFeedback("");
      setDryRunResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated || !authToken) {
      setError("Authentication required. Please sign in.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        }
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `processed_${filename}`;
      a.click();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetWorkflow = () => {
    setStep("upload");
    setSessionId(null);
    setProfile(null);
    setFilename("");
    setTaskType("");
    setTargetColumn("");
    setPlan(null);
    setExecutionResult(null);
    setReport(null);
    setError(null);
    setFeedback("");
    setDryRunResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Show loading state while getting token
  if (isAuthenticated && tokenLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Initializing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LLM-Driven Data Preparation Engine
          </h1>
          <p className="text-gray-600">
            AI-powered dataset preprocessing for machine learning
          </p>

          {/* Authentication Status */}
          {!isAuthenticated && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">
                Please sign in to use the data preparation engine
              </span>
            </div>
          )}

          {isAuthenticated && authToken && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-800 font-medium">
                Authenticated and ready
              </span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4">
            {["upload", "configure", "review", "results"].map((s, idx) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center space-x-2 ${
                    step === s ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === s ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="font-medium capitalize">{s}</span>
                </div>
                {idx < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      ["configure", "review", "results"].indexOf(s) <
                      ["configure", "review", "results"].indexOf(step)
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Disable interaction if not authenticated */}
        <div className={!isAuthenticated || !authToken ? "opacity-50 pointer-events-none" : ""}>
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <Upload className="mx-auto mb-4 text-blue-600" size={48} />
                <h2 className="text-2xl font-bold mb-2">Upload Your Dataset</h2>
                <p className="text-gray-600 mb-6">
                  Upload a CSV file to begin the data preparation process
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={!isAuthenticated || !authToken}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-6 py-3 rounded-lg transition ${
                    isAuthenticated && authToken
                      ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Upload size={20} className="mr-2" />
                  {loading
                    ? "Uploading..."
                    : !isAuthenticated || !authToken
                    ? "Sign in to upload"
                    : "Choose CSV File"}
                </label>
              </div>
            </div>
          )}
          </div>

        {/* Step 2: Configure */}
        {step === "configure" && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Configure Task</h2>

            {/* Dataset Profile Summary */}
            {profile && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Dataset: {filename}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Rows:</span>{" "}
                    <span className="font-medium">
                      {profile.shape?.rows || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Columns:</span>{" "}
                    <span className="font-medium">
                      {profile.shape?.columns || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Missing Values:</span>{" "}
                    <span className="font-medium">
                      {profile.missing_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Task Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select ML Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a task...</option>
                {supportedTasks &&
                  Array.isArray(supportedTasks.tasks) &&
                  supportedTasks.tasks.map((task) => (
                    <option key={task} value={task}>
                      {task}
                    </option>
                  ))}
              </select>
            </div>

            {/* Target Column (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Column (Optional)
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Auto-detect or no target</option>
                {profile &&
                  Array.isArray(profile.columns) &&
                  profile.columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Columns Preview */}
            {profile &&
              Array.isArray(profile.columns) &&
              profile.columns.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Columns Overview</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Column</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Missing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.columns.map((col) => (
                          <tr key={col.name} className="border-t">
                            <td className="px-4 py-2">{col.name}</td>
                            <td className="px-4 py-2">{col.dtype}</td>
                            <td className="px-4 py-2">
                              {col.missing_count || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            <div className="flex space-x-4">
              <button
                onClick={resetWorkflow}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={!taskType || loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2" size={20} />
                    Generate Plan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Plan */}
        {step === "review" && plan && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">
              Review Preprocessing Plan
            </h2>

            {/* Pipeline Steps */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Pipeline Steps</h3>
              <div className="space-y-3">
                {plan &&
                  Array.isArray(plan.pipeline) &&
                  plan.pipeline.map((step, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{step.operation}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.reasoning}
                          </p>
                          {step.parameters &&
                            Object.keys(step.parameters).length > 0 && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Parameters:</span>
                                <div className="ml-4 mt-1">
                                  {Object.entries(step.parameters).map(
                                    ([key, value]) => (
                                      <div key={key}>
                                        <span className="text-gray-600">
                                          {key}:
                                        </span>{" "}
                                        <span className="font-mono">
                                          {JSON.stringify(value)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Feedback Section */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Modify Plan (Optional)</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to regenerate the plan (e.g., 'Remove outlier detection' or 'Use different encoding method')"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleRegeneratePlan}
                disabled={!feedback || loading}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2" size={16} />
                    Regenerate Plan
                  </>
                )}
              </button>
            </div>

            {/* Dry Run Results */}
            {dryRunResult && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Eye className="mr-2" size={20} />
                  Estimated Impact
                </h3>
                <div className="text-sm space-y-1">
                  <div>Rows after processing: {dryRunResult.rows_after}</div>
                  <div>
                    Columns after processing: {dryRunResult.columns_after}
                  </div>
                  {dryRunResult.warnings &&
                    dryRunResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Warnings:</span>
                        <ul className="ml-4 list-disc">
                          {dryRunResult.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep("configure")}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleDryRun}
                disabled={loading}
                className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center"
              >
                <Eye className="mr-2" size={20} />
                Dry Run
              </button>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Executing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2" size={20} />
                    Execute Pipeline
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === "results" && executionResult && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={32} />
              Processing Complete
            </h2>

            {/* Summary */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {executionResult &&
                  executionResult.summary &&
                  Object.entries(executionResult.summary).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-600">
                          {key.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="font-medium">
                          {JSON.stringify(value)}
                        </span>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* Execution Log */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Execution Log</h3>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 font-mono text-sm">
                {executionResult &&
                  Array.isArray(executionResult.execution_log) &&
                  executionResult.execution_log.map((log, idx) => (
                    <div key={idx} className="mb-2">
                      <span
                        className={`font-semibold ${
                          log.status === "success"
                            ? "text-green-600"
                            : log.status === "warning"
                            ? "text-yellow-600"
                            : log.status === "error"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        [{log.status.toUpperCase()}]
                      </span>{" "}
                      {log.message}
                    </div>
                  ))}
              </div>
            </div>

            {/* Report */}
            {report && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Detailed Report</h3>
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={resetWorkflow}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <RefreshCw className="mr-2" size={20} />
                Start New
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Download className="mr-2" size={20} />
                Download Processed Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
