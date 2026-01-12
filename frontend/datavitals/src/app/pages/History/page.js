"use client";
import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  BarChart3,
  Activity,
  RefreshCw,
  FileText,
  ChevronRight,
  XCircle,
  Target,
  Database,
  ArrowLeft,
  Layers,
  PieChart,
  Shield,
  Zap,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ============================================================================
// DATASETS HISTORY PAGE
// ============================================================================
function DatasetsHistoryPage({ onViewReport, onBack }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState(null);

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        scope: "openid profile email",
      },
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response;
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/reports/history?limit=50&skip=0`
      );
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/reports/stats`
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
      fetchStats();
    }
  }, [isAuthenticated]);

  const deleteReport = async (reportId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/reports/${reportId}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        setReports(reports.filter((r) => r._id !== reportId));
        fetchStats();
      }
    } catch (err) {
      alert("Failed to delete report");
    }
  };

  const getFilteredReports = () => {
    let filtered = [...reports];

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.target_column?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => {
        const score = r.health_score || 0;
        if (filterStatus === "excellent") return score >= 80;
        if (filterStatus === "good") return score >= 60 && score < 80;
        if (filterStatus === "warning") return score >= 40 && score < 60;
        if (filterStatus === "poor") return score < 40;
        return true;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === "date_desc")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "date_asc")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "score_desc")
        return (b.health_score || 0) - (a.health_score || 0);
      if (sortBy === "score_asc")
        return (a.health_score || 0) - (b.health_score || 0);
      if (sortBy === "name_asc")
        return (a.filename || "").localeCompare(b.filename || "");
      return 0;
    });

    return filtered;
  };

  const filteredReports = getFilteredReports();

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-100 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-100 border-yellow-200";
    return "text-red-600 bg-red-100 border-red-200";
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return Activity;
    if (score >= 40) return AlertCircle;
    return XCircle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Analyzer</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Datasets</h1>
              <p className="text-gray-600">
                View and manage your analysis history
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-5 shadow-lg border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Total Analyses
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats.total_reports || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Avg Health Score
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats.avg_health_score?.toFixed(1) || "N/A"}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      This Month
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stats.reports_this_month || 0}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-lg border border-pink-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Last Analysis
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {stats.last_report_date
                        ? new Date(stats.last_report_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Clock className="w-8 h-8 text-pink-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="excellent">Excellent (80+)</option>
                <option value="good">Good (60-79)</option>
                <option value="warning">Warning (40-59)</option>
                <option value="poor">Poor (&lt;40)</option>
              </select>
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
                <option value="name_asc">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No datasets found
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Upload your first dataset to get started"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => {
              const ScoreIcon = getScoreIcon(report.health_score);
              return (
                <div
                  key={report._id}
                  onClick={() => onViewReport(report._id)}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {report.filename}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>Target: {report.target_column}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="w-4 h-4" />
                            <span>
                              {report.total_rows?.toLocaleString()} rows
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="w-4 h-4" />
                            <span>{report.total_columns} columns</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {report.top_risks && report.top_risks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {report.top_risks.slice(0, 3).map((risk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200"
                              >
                                {risk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getScoreColor(
                          report.health_score
                        )}`}
                      >
                        <ScoreIcon className="w-5 h-5" />
                        <span className="font-bold text-lg">
                          {report.health_score}
                        </span>
                      </div>

                      <button
                        onClick={(e) => deleteReport(report._id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// REPORT VIEWER PAGE
// ============================================================================
function ReportViewerPage({ reportId, onBack }) {
  const { getAccessTokenSilently } = useAuth0();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        const response = await fetch(
          `${API_BASE_URL}/api/reports/${reportId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setReport(data.report);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report Not Found
          </h2>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const insights = report.detailed_analysis || {};
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Datasets</span>
        </button>

        {/* Report Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {report.filename}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Target: {report.target_column}</span>
                <span>•</span>
                <span>{report.total_rows?.toLocaleString()} rows</span>
                <span>•</span>
                <span>{report.total_columns} columns</span>
                <span>•</span>
                <span>{new Date(report.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div
              className={`px-6 py-3 rounded-xl ${getScoreColor(
                report.health_score
              )}`}
            >
              <p className="text-sm font-medium">Health Score</p>
              <p className="text-3xl font-bold">{report.health_score}</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
              <Shield className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="text-sm text-gray-600">Missing Data</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.missing?.total_missing_percentage?.toFixed(1) || 0}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <Zap className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-sm text-gray-600">High Quality Features</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.features?.high_quality?.length || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <PieChart className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-sm text-gray-600">Numeric Features</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.profile?.numeric_columns?.length || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg">
              <Database className="w-8 h-8 text-pink-600 mb-2" />
              <p className="text-sm text-gray-600">Categorical Features</p>
              <p className="text-2xl font-bold text-gray-900">
                {insights.profile?.categorical_columns?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Top Risks */}
        {report.top_risks && report.top_risks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Risks</h2>
            <div className="space-y-2">
              {report.top_risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recommendations
            </h2>
            <div className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-800">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Dataset Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Basic Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Rows:</span>
                  <span className="font-medium">
                    {report.total_rows?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Columns:</span>
                  <span className="font-medium">{report.total_columns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Column:</span>
                  <span className="font-medium">{report.target_column}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Quality</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Health Score:</span>
                  <span className="font-medium">{report.health_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Missing Data:</span>
                  <span className="font-medium">
                    {insights.missing?.total_missing_percentage?.toFixed(1) ||
                      0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duplicates:</span>
                  <span className="font-medium">
                    {report.summary?.duplicate_rows || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT WITH NAVIGATION
// ============================================================================
export default function MyDatasetsApp() {
  const { isAuthenticated } = useAuth0();
  const [currentPage, setCurrentPage] = useState("history"); // 'history' or 'report'
  const [selectedReportId, setSelectedReportId] = useState(null);

  const handleViewReport = (reportId) => {
    setSelectedReportId(reportId);
    setCurrentPage("report");
  };

  const handleBackToHistory = () => {
    setCurrentPage("history");
    setSelectedReportId(null);
  };

  const handleBackToHome = () => {
    // This would navigate to your home page
    // In a real Next.js app, you'd use: router.push('/')
    window.location.href = "/";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <FileSpreadsheet className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h2>
          <p className="text-gray-600">
            Please sign in to view your analysis history
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === "report" && selectedReportId) {
    return (
      <ReportViewerPage
        reportId={selectedReportId}
        onBack={handleBackToHistory}
      />
    );
  }

  return (
    <DatasetsHistoryPage
      onViewReport={handleViewReport}
      onBack={handleBackToHome}
    />
  );
}
