import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getAQIColor(aqi) {
  if (aqi <= 50) {
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-400",
      border: "border-emerald-500/40",
      label: "Good",
    };
  }
  if (aqi <= 100) {
    return {
      bg: "bg-green-500",
      text: "text-green-400",
      border: "border-green-500/40",
      label: "Satisfactory",
    };
  }
  if (aqi <= 200) {
    return {
      bg: "bg-yellow-500",
      text: "text-yellow-400",
      border: "border-yellow-500/40",
      label: "Moderate",
    };
  }
  if (aqi <= 300) {
    return {
      bg: "bg-orange-500",
      text: "text-orange-400",
      border: "border-orange-500/40",
      label: "Poor",
    };
  }
  if (aqi <= 400) {
    return {
      bg: "bg-red-500",
      text: "text-red-400",
      border: "border-red-500/40",
      label: "Very Poor",
    };
  }
  return {
    bg: "bg-rose-900",
    text: "text-rose-400",
    border: "border-rose-900/60",
    label: "Severe",
  };
}

export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}