// Utility functions for data access and formatting

export const safeGet = (obj, path, defaultValue = 0) =>
  path.split(".").reduce((acc, key) => acc?.[key], obj) ?? defaultValue;

export const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

export const getSeverityColor = (severity) => {
  if (severity === "high") return "text-red-600 bg-red-50";
  if (severity === "medium") return "text-yellow-600 bg-yellow-50";
  if (severity === "low") return "text-green-600 bg-green-50";
  return "text-gray-600 bg-gray-50";
};

export const getRiskColor = (risk) => {
  if (risk === "critical") return "bg-red-100 text-red-700 border-red-300";
  if (risk === "high") return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-yellow-100 text-yellow-700 border-yellow-300";
};

export const getOverfittingColor = (severity) => {
  if (severity === "severe") return "bg-red-50 border-red-300 text-red-800";
  if (severity === "moderate")
    return "bg-yellow-50 border-yellow-300 text-yellow-800";
  if (severity === "mild")
    return "bg-orange-50 border-orange-300 text-orange-800";
  return "bg-green-50 border-green-300 text-green-800";
};

export const getGradeColor = (grade) => {
  if (grade === "A") return "bg-green-500 text-white";
  if (grade === "B") return "bg-blue-500 text-white";
  if (grade === "C") return "bg-yellow-500 text-white";
  if (grade === "D") return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
};

export const formatBytes = (bytes) => {
  return (bytes / 1024).toFixed(2);
};

export const formatNumber = (num) => {
  return num?.toLocaleString() || 0;
};
