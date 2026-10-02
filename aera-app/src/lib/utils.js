export function getAQIColor(aqi) {
  if (aqi <= 50) {
    return {
      text: "#34d399",
      bg: "rgba(52, 211, 153, 0.1)",
      border: "rgba(52, 211, 153, 0.3)",
      label: "Good",
    };
  }
  if (aqi <= 100) {
    return {
      text: "#4ade80",
      bg: "rgba(74, 222, 128, 0.1)",
      border: "rgba(74, 222, 128, 0.3)",
      label: "Satisfactory",
    };
  }
  if (aqi <= 200) {
    return {
      text: "#facc15",
      bg: "rgba(250, 204, 21, 0.1)",
      border: "rgba(250, 204, 21, 0.3)",
      label: "Moderate",
    };
  }
  if (aqi <= 300) {
    return {
      text: "#fb923c",
      bg: "rgba(251, 146, 60, 0.1)",
      border: "rgba(251, 146, 60, 0.3)",
      label: "Poor",
    };
  }
  if (aqi <= 400) {
    return {
      text: "#f87171",
      bg: "rgba(248, 113, 113, 0.1)",
      border: "rgba(248, 113, 113, 0.3)",
      label: "Very Poor",
    };
  }
  return {
    text: "#fb7185",
    bg: "rgba(251, 113, 133, 0.1)",
    border: "rgba(251, 113, 133, 0.3)",
    label: "Severe",
  };
}

export function formatTime(isoString) {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}