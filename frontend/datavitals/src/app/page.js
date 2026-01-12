"use client";
import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  BarChart2,
  Database,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Activity,
  Filter,
  PieChart,
  Target,
  Layers,
  RefreshCw,
  BarChart3,
  Brain,
  User,
  Settings,
  LogOut,
  FileSpreadsheet,
  HelpCircle,
  CreditCard,
  Bell,
  ChevronDown,
  Sparkles,
  BrushCleaning,
} from "lucide-react";
import Link from "next/link";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function CSVHealthChecker() {
  const {
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [activeTab, setActiveTab] = useState("checker");
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    try {
      console.log("🔐 Making authenticated request to:", url);
      
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      });

      console.log("✅ Token obtained:", token.substring(0, 30) + "...");

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error("❌ API request failed:", error);
      throw error;
    }
  };

  // Initialize user in backend when authenticated
  useEffect(() => {
    const initializeUser = async () => {
      if (!isAuthenticated || !user) {
        console.log("⏭️ Skipping init - not authenticated");
        return;
      }

      try {
        setAuthLoading(true);
        console.log("🔐 User authenticated, initializing backend session...");
        console.log("👤 User info:", user);

        // FIXED: Use the helper function instead of direct fetch
        const response = await makeAuthenticatedRequest(
          `${API_BASE_URL}/api/user/stats`,
          { method: "GET" }
        );

        const stats = await response.json();
        setUserStats(stats);
        console.log("✅ User stats loaded:", stats);
      } catch (error) {
        console.error("❌ Error initializing user:", error);
        // Don't show error to user for stats loading failure
        // They can still use the app
      } finally {
        setAuthLoading(false);
      }
    };

    initializeUser();
  }, [isAuthenticated, user]); // Removed getAccessTokenSilently from deps

  // Function to fetch user stats (can be called manually)
  const fetchUserStats = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/user/stats`,
        { method: "GET" }
      );

      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
        console.log("✓ User stats refreshed:", stats);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };
  const testAuth = async () => {
    try {
      console.log("🧪 Testing auth endpoint...");
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/test-auth`,
        { method: "GET" }
      );

      const data = await response.json();
      console.log("✅ Test auth response:", data);
      alert("Auth working! Check console for details.");
    } catch (error) {
      console.error("❌ Test auth failed:", error);
      alert("Auth failed! Check console for details.");
    }
  };

  const colorMap = {
    red: "text-red-500",
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
    indigo: "text-indigo-500",
    orange: "text-orange-500",
    pink: "text-pink-500",
    teal: "text-teal-500",
    cyan: "text-cyan-500",
    emerald: "text-emerald-500",
    violet: "text-violet-500",
    yellow: "text-yellow-500",
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f3eeea] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? "Loading..." : "Initializing session..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-[#f3eeea]">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/98 backdrop-blur-xl shadow-2xl"
            : " backdrop-blur-md shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-0 px-2 sm:px-2 lg:px-2">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Animation */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 inline-block transition-transform duration-300">
                  DataVitals
                </span>
              </div>
            </div>

            {/* Navigation Links
            <div className="hidden md:flex absolute left-50 gap-1">
              {["Home", "Features", "Pricing", "Docs", "About"].map(
                (item, index) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="relative px-4 py-2 text-[#9d8776] hover:text-indigo-600 font-medium transition-all duration-300 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="relative z-10">{item}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all duration-300"></div>
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-3/4 group-hover:left-[12.5%] transition-all duration-300"></div>
                  </a>
                )
              )}
            </div> */}

            {/* Auth Section */}
            <div className="absolute right-4 flex items-center gap-4">
              {!isAuthenticated ? (
                <button
                  onClick={() => loginWithRedirect()}
                  className="relative group overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Sign In
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="relative group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                    <div className="relative flex items-center gap-3">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-8 h-8 rounded-full ring-2 ring-white/30"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-semibold hidden sm:block">
                        {user?.name || "User"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          showDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setShowDropdown(false)}
                      ></div>

                      <div className="absolute right-0 mt-4 w-72 z-50">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-30"></div>

                          <div className="relative bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 py-6">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                              <div className="relative flex items-center gap-4">
                                {user?.picture ? (
                                  <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-14 h-14 rounded-full ring-4 ring-white/30 shadow-lg"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30 shadow-lg">
                                    <User className="w-7 h-7 text-white" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-white font-bold text-lg">
                                    {user?.name || "User"}
                                  </p>
                                  <p className="text-indigo-100 text-sm">
                                    {user?.email || "user@example.com"}
                                  </p>
                                  {/* {userStats && (
                                    <p className="text-indigo-200 text-xs mt-1">
                                      {userStats.total_datasets} datasets •{" "}
                                      {userStats.api_calls} API calls
                                    </p>
                                  )} */}
                                </div>
                              </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-3">
                              {[
                                // {
                                //   icon: User,
                                //   label: "My Profile",
                                //   color: "from-blue-500 to-indigo-500",
                                // },
                                {
                                  icon: FileSpreadsheet,
                                  label: "My Datasets",
                                  color: "from-purple-500 to-pink-500",
                                },
                                // {
                                //   icon: Bell,
                                //   label: "Notifications",
                                //   color: "from-yellow-500 to-orange-500",
                                //   badge: "3",
                                // },
                                // {
                                //   icon: Settings,
                                //   label: "Settings",
                                //   color: "from-green-500 to-teal-500",
                                // },
                                // {
                                //   icon: HelpCircle,
                                //   label: "Help & Support",
                                //   color: "from-cyan-500 to-blue-500",
                                // },
                              ].map((item, index) => (
                                <button
                                  key={item.label}
                                  className="w-full px-6 py-3 text-left text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 flex items-center gap-4 transition-all duration-300 group relative overflow-hidden"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-indigo-600 to-purple-600 group-hover:h-full transition-all duration-300"></div>
                                  <div
                                    className={`w-9 h-9 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center text-white transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md`}
                                  >
                                    <item.icon className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium group-hover:text-indigo-600 transition-colors duration-300 flex-1">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                      {item.badge}
                                    </span>
                                  )}
                                </button>
                              ))}

                              <hr className="my-3 border-gray-200" />

                              <button
                                onClick={() => {
                                  logout({
                                    returnTo: window.location.origin,
                                  });
                                  setShowDropdown(false);
                                }}
                                className="w-full px-6 py-3 text-left hover:bg-red-50 flex items-center gap-4 transition-all duration-300 group relative overflow-hidden"
                              >
                                <div className="absolute left-0 w-1 h-0 bg-red-500 group-hover:h-full transition-all duration-300"></div>
                                <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors duration-300">
                                  <LogOut className="w-4 h-4 text-red-600" />
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-red-600 transition-colors duration-300">
                                  Sign Out
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#f3eeea] to-[#9d8776] min-h-screen overflow-hidden ">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl lg:top-12 mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center ">
            <div className="flex justify-center mb-">
              {/* <div className="bg-white p-4 rounded-2xl shadow-2xl">
                <Database className="w-16 h-16 text-indigo-600" />
              </div> */}
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              CSV Health Checker & Cleaner
            </h1>
            <p className="text-xl lg:text-2xl text-indigo-100 mb-5 lg:mb-12 max-w-3xl mx-auto">
              Get instant insights and ML-ready datasets in minutes, not hours
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-10 lg:mb-16">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-xl mb-4 inline-flex group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Dataset Summary
                </h3>
                <p className="text-indigo-100 text-sm">
                  Complete overview of your data structure and composition
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl mb-4 inline-flex group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  AI Suggestions
                </h3>
                <p className="text-indigo-100 text-sm">
                  Smart recommendations tailored to your dataset
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group">
                <div className="bg-gradient-to-br from-green-500 to-teal-500 p-4 rounded-xl mb-4 inline-flex group-hover:scale-110 transition-transform duration-300">
                  <BrushCleaning className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Data Cleaning
                </h3>
                <p className="text-indigo-100 text-sm">
                  Cleans your dataset based on UseCase
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-xl mb-4 inline-flex group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Performance
                </h3>
                <p className="text-indigo-100 text-sm">
                  Baseline model performance metrics
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pages/analysis">
                <button
                  type="button"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Try Health Checker
                </button>
              </Link>
              <Link href="/pages/cleaning">
                <button
                  type="button"
                  className="bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:bg-indigo-800 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try CSV Cleaner
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {/* Product Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-4 mb-12 justify-center">
          <button
            onClick={() => setActiveTab("checker")}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              activeTab === "checker"
                ? "bg-white text-indigo-600 shadow-xl"
                : "bg-indigo-700 bg-opacity-50 text-white hover:bg-opacity-70"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Health Checker
            </div>
          </button>
          <button
            onClick={() => setActiveTab("cleaner")}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              activeTab === "cleaner"
                ? "bg-white text-indigo-600 shadow-xl"
                : "bg-indigo-700 bg-opacity-50 text-white hover:bg-opacity-70"
            }`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              CSV Cleaner
            </div>
          </button>
        </div>

        {/* Health Checker Section */}
        {activeTab === "checker" && (
          <div className="space-y-12">
            {/* Features Grid */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Comprehensive Dataset Analysis
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: AlertCircle,
                    title: "Top Risks Detection",
                    desc: "Identify critical issues like overfitting, data leakage",
                    color: "red",
                  },
                  {
                    icon: Database,
                    title: "Dataset Summary",
                    desc: "Complete overview of rows, columns, memory usage",
                    color: "blue",
                  },
                  {
                    icon: CheckCircle,
                    title: "Recommendations",
                    desc: "AI-powered suggestions for data improvements",
                    color: "green",
                  },
                  {
                    icon: Shield,
                    title: "Data Leakage Detection",
                    desc: "Prevent target leakage and feature contamination",
                    color: "purple",
                  },
                  {
                    icon: TrendingUp,
                    title: "Baseline Model Performance",
                    desc: "Quick ML performance estimates",
                    color: "indigo",
                  },
                  {
                    icon: FileText,
                    title: "Missing Value Analysis",
                    desc: "Detailed missing data patterns and impacts",
                    color: "orange",
                  },
                  {
                    icon: BarChart2,
                    title: "Feature Quality Assessment",
                    desc: "Evaluate feature importance and quality",
                    color: "pink",
                  },
                  {
                    icon: PieChart,
                    title: "Column Type Distribution",
                    desc: "Analyze data types and distributions",
                    color: "teal",
                  },
                  {
                    icon: Layers,
                    title: "Distribution & Outlier Analysis",
                    desc: "Detect anomalies and outliers",
                    color: "cyan",
                  },
                  {
                    icon: Target,
                    title: "Target Variable Analysis",
                    desc: "Examine target distribution and balance",
                    color: "emerald",
                  },
                  {
                    icon: Filter,
                    title: "Feature Correlation",
                    desc: "Discover feature relationships",
                    color: "violet",
                  },
                  {
                    icon: Zap,
                    title: "Model Readiness Score",
                    desc: "Get 0-100 ML readiness rating",
                    color: "yellow",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200"
                  >
                    <feature.icon
                      className={`w-12 h-12 mb-4 ${colorMap[feature.color]}`}
                    />

                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Example Reports */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-black text-center mb-8">
                Sample Report Output
              </h2>

              {/* Top Risks Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Top Risks Detected
                  </h3>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        #1
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">
                          Severe Overfitting Detected
                        </h4>
                        <p className="text-gray-600">
                          Train-test performance gap: 21.93%
                        </p>
                      </div>
                    </div>
                    <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      CRITICAL
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-red-800 font-semibold">
                      Impact: Model will not generalize to new data
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Recommended Action:
                        </p>
                        <p className="text-gray-600">
                          Increase data size, reduce model complexity, or add
                          regularization
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-mono">
                      Type: SEVERE_OVERFITTING
                    </span>
                  </div>
                </div>
              </div>

              {/* Dataset Summary Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Database className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Dataset Summary
                  </h3>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Analysis Phase</p>
                    <p className="text-2xl font-bold text-blue-600">Complete</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Dataset Shape</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      13,320 × 9
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Memory Usage</p>
                    <p className="text-2xl font-bold text-purple-600">
                      4.66 MB
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Missing Data</p>
                    <p className="text-2xl font-bold text-yellow-600">5.17%</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Duplicates</p>
                    <p className="text-2xl font-bold text-orange-600">3.97%</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Target Column</p>
                    <p className="text-xl font-bold text-green-600">
                      X Missing
                    </p>
                  </div>
                </div>
              </div>

              {/* Health Score Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800">
                        Dataset is in good health with minor issues
                      </h3>
                      <p className="text-gray-600">
                        Safe to train after reviewing warnings
                      </p>
                      <p className="text-sm text-indigo-600 font-semibold">
                        File: Bengaluru_House_Data.csv | Target: price
                      </p>
                    </div>
                    <div className="bg-yellow-500 w-20 h-20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">C</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-6 h-6 text-indigo-600" />
                      <h4 className="text-xl font-bold text-gray-800">
                        Overall Health Score
                      </h4>
                    </div>
                    <p className="text-6xl font-bold text-indigo-600 mb-2">
                      76.8<span className="text-3xl">/100</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                      Component Scores
                    </h4>
                    {[
                      { name: "Baseline", score: 4, max: 10 },
                      { name: "Data Size", score: 10, max: 10 },
                      { name: "Distribution", score: 10, max: 10 },
                      { name: "Features", score: 10, max: 10 },
                      { name: "Imbalance", score: 6, max: 10 },
                      { name: "Leakage", score: 30, max: 30 },
                      { name: "Missing", score: 7, max: 10 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-24">
                          {item.name}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.score / item.max) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-8 text-right">
                          {item.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <p className="text-gray-600 text-xs mb-1">Total Rows</p>
                    <p className="text-xl font-bold text-blue-600">13,320</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <p className="text-gray-600 text-xs mb-1">Total Columns</p>
                    <p className="text-xl font-bold text-purple-600">9</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl text-center">
                    <p className="text-gray-600 text-xs mb-1">Memory Size</p>
                    <p className="text-xl font-bold text-orange-600">4.66 MB</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <p className="text-gray-600 text-xs mb-1">Duplicates</p>
                    <p className="text-xl font-bold text-green-600">3.97%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                How It Works
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    1. Upload CSV
                  </h3>
                  <p className="text-gray-600">
                    Upload any CSV file from your computer
                  </p>
                </div>

                <ArrowRight className="w-8 h-8 text-indigo-400 rotate-90 md:rotate-0" />

                <div className="flex-1 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Activity className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    2. ML Analysis
                  </h3>
                  <p className="text-gray-600">
                    ML Stats + heuristics + light ML processing
                  </p>
                </div>

                <ArrowRight className="w-8 h-8 text-indigo-400 rotate-90 md:rotate-0" />

                <div className="flex-1 text-center">
                  <div className="bg-gradient-to-br from-pink-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    3. Get Report
                  </h3>
                  <p className="text-gray-600">
                    Comprehensive report with actionable suggestions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Cleaner Section */}
        {activeTab === "cleaner" && (
          <div className="space-y-12">
            {/* Description */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-xl">
                  <RefreshCw className="w-16 h-16 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                LLM-Powered CSV Cleaning Engine
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A purpose-aware CSV cleaning engine that profiles datasets, uses
                AI to design a cleaning plan, and safely executes it for ML use
                cases
              </p>
            </div>

            {/* How It Works - Flow Diagram */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
                How It Works
              </h2>

              <div className="max-w-2xl mx-auto">
                {/* Step 1 */}
                <div className="flex items-start gap-6 mb-8">
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border-2 border-indigo-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Upload className="w-8 h-8 text-indigo-600" />
                      <h3 className="text-xl font-bold text-gray-800">Input</h3>
                    </div>
                    <p className="text-gray-700 font-medium">CSV + Purpose</p>
                    <p className="text-sm text-gray-600 mt-1">
                      User provides dataset and intended use case
                    </p>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="border-l-4 border-indigo-400 h-12"></div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-6 mb-8">
                  <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="w-8 h-8 text-purple-600" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Dataset Profiler
                      </h3>
                    </div>
                    <p className="text-gray-700">
                      Analyzes data structure, types, quality issues
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Missing Values
                      </span>
                      <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Outliers
                      </span>
                      <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Duplicates
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="border-l-4 border-purple-400 h-12"></div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-6 mb-8">
                  <div className="flex-1 bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl border-2 border-pink-300 shadow-lg relative">
                    <div className="absolute -right-3 -top-3 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      PURPOSE-AWARE
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-8 h-8 text-pink-600" />
                      <h3 className="text-xl font-bold text-gray-800">
                        LLM Planner (AI)
                      </h3>
                    </div>
                    <p className="text-gray-700">
                      AI designs custom cleaning strategy based on purpose
                    </p>
                    <div className="mt-3 bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600 italic">
                        "For regression: impute numeric, encode categorical,
                        remove outliers beyond 3 std..."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="border-l-4 border-pink-400 h-12"></div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-6 mb-8">
                  <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border-2 border-green-300 shadow-lg relative">
                    <div className="absolute -right-3 -top-3 bg-blue-400 text-blue-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      SAME FOR ALL
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-8 h-8 text-green-600" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Execution Engine
                      </h3>
                    </div>
                    <p className="text-gray-700">
                      Safely executes cleaning plan with validation
                    </p>
                    <div className="mt-3 flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">
                        Validated & Type-Safe
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="border-l-4 border-green-400 h-12"></div>
                </div>

                {/* Step 5 - Output */}
                <div className="flex items-start gap-6">
                  <div className="flex-1 bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border-2 border-yellow-300 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-8 h-8 text-yellow-600" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Cleaned Dataset
                      </h3>
                    </div>
                    <p className="text-gray-700 font-medium">
                      ML-ready, purpose-optimized data
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Before & After Comparison */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Before & After
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border-2 border-red-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-500 p-2 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Before Cleaning
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Missing Values
                      </span>
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full font-bold">
                        15.3%
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Duplicates
                      </span>
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full font-bold">
                        234 rows
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Outliers
                      </span>
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full font-bold">
                        8.7%
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Invalid Types
                      </span>
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full font-bold">
                        127
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Data Quality Score
                      </span>
                      <span className="bg-red-200 text-red-800 px-4 py-1 rounded-full font-bold text-lg">
                        42/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border-2 border-green-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      After Cleaning
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Missing Values
                      </span>
                      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-bold">
                        0%
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Duplicates
                      </span>
                      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-bold">
                        0 rows
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Outliers
                      </span>
                      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-bold">
                        Handled
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Invalid Types
                      </span>
                      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-bold">
                        0
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Data Quality Score
                      </span>
                      <span className="bg-green-200 text-green-800 px-4 py-1 rounded-full font-bold text-lg">
                        94/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transformation Summary */}
              <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
                <h4 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  Cleaning Actions Applied
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-800">
                      Imputed Missing
                    </p>
                    <p className="text-sm text-gray-600">
                      Smart fill strategies
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center">
                    <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-800">
                      Removed Duplicates
                    </p>
                    <p className="text-sm text-gray-600">234 rows cleaned</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center">
                    <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-800">
                      Handled Outliers
                    </p>
                    <p className="text-sm text-gray-600">Capped at 3σ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Key Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-500 p-3 rounded-xl">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Purpose-Aware AI
                      </h3>
                      <p className="text-gray-600">
                        LLM understands your ML use case and designs custom
                        cleaning strategy
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-500 p-3 rounded-xl">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Safe Execution
                      </h3>
                      <p className="text-gray-600">
                        Validated operations with rollback capability and data
                        integrity checks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-500 p-3 rounded-xl">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        ML-Optimized
                      </h3>
                      <p className="text-gray-600">
                        Cleaning specifically designed for machine learning
                        workflows and models
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-2xl border border-orange-200">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-500 p-3 rounded-xl">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Automated Profiling
                      </h3>
                      <p className="text-gray-600">
                        Comprehensive dataset analysis with quality metrics and
                        recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Get instant insights and ML-ready datasets in minutes, not hours
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-600 px-10 py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3">
              <Upload className="w-6 h-6" />
              Try Health Checker Free
            </button>
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6" />
              Try CSV Cleaner Free
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-indigo-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Database className="w-12 h-12 text-indigo-300" />
          </div>
          <h3 className="text-2xl font-bold mb-4">
            CSV Health Checker & Cleaner
          </h3>
          <p className="text-indigo-200 mb-8 max-w-2xl mx-auto">
            Professional-grade data quality tools powered by AI for data
            scientists and ML engineers
          </p>
          {/* <div className="flex flex-wrap justify-center gap-6 text-sm text-indigo-300">
            <a href="#" className="hover:text-white transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-white transition-colors">
              API Reference
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Examples
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Support
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div> */}
          <div className="mt-8 pt-8 border-t border-indigo-800">
            <p className="text-sm text-indigo-400">
              © 2026 CSV Health Checker. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
