import React, { useEffect, useRef, useState } from "react";
import "./CesiumGlobe.css";

const CesiumGlobe = ({ globalRiskData, onRefresh }) => {
  const containerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [activeRisk, setActiveRisk] = useState("flood"); // 'flood' or 'heat'
  const [cities, setCities] = useState([]);

  // Sample city data if none provided
  const defaultCities = [
    {
      name: "Mumbai",
      country: "India",
      lon: 72.8777,
      lat: 19.076,
      floodRisk: 0.85,
      heatRisk: 0.65,
    },
    {
      name: "New York",
      country: "USA",
      lon: -74.006,
      lat: 40.7128,
      floodRisk: 0.45,
      heatRisk: 0.55,
    },
    {
      name: "London",
      country: "UK",
      lon: -0.1278,
      lat: 51.5074,
      floodRisk: 0.6,
      heatRisk: 0.3,
    },
    {
      name: "Tokyo",
      country: "Japan",
      lon: 139.6917,
      lat: 35.6895,
      floodRisk: 0.7,
      heatRisk: 0.5,
    },
    {
      name: "Shanghai",
      country: "China",
      lon: 121.4737,
      lat: 31.2304,
      floodRisk: 0.8,
      heatRisk: 0.6,
    },
    {
      name: "Miami",
      country: "USA",
      lon: -80.1918,
      lat: 25.7617,
      floodRisk: 0.9,
      heatRisk: 0.75,
    },
    {
      name: "Dhaka",
      country: "Bangladesh",
      lon: 90.4125,
      lat: 23.8103,
      floodRisk: 0.95,
      heatRisk: 0.7,
    },
    {
      name: "Cairo",
      country: "Egypt",
      lon: 31.2357,
      lat: 30.0444,
      floodRisk: 0.2,
      heatRisk: 0.85,
    },
    {
      name: "Sydney",
      country: "Australia",
      lon: 151.2093,
      lat: -33.8688,
      floodRisk: 0.35,
      heatRisk: 0.45,
    },
    {
      name: "Rio",
      country: "Brazil",
      lon: -43.1729,
      lat: -22.9068,
      floodRisk: 0.55,
      heatRisk: 0.6,
    },
    {
      name: "Moscow",
      country: "Russia",
      lon: 37.6173,
      lat: 55.7558,
      floodRisk: 0.25,
      heatRisk: 0.2,
    },
    {
      name: "Cape Town",
      country: "South Africa",
      lon: 18.4241,
      lat: -33.9249,
      floodRisk: 0.3,
      heatRisk: 0.5,
    },
    {
      name: "Jakarta",
      country: "Indonesia",
      lon: 106.8456,
      lat: -6.2088,
      floodRisk: 0.75,
      heatRisk: 0.65,
    },
    {
      name: "Lagos",
      country: "Nigeria",
      lon: 3.3792,
      lat: 6.5244,
      floodRisk: 0.7,
      heatRisk: 0.8,
    },
    {
      name: "Mexico City",
      country: "Mexico",
      lon: -99.1332,
      lat: 19.4326,
      floodRisk: 0.5,
      heatRisk: 0.7,
    },
    {
      name: "Istanbul",
      country: "Turkey",
      lon: 28.9784,
      lat: 41.0082,
      floodRisk: 0.45,
      heatRisk: 0.55,
    },
    {
      name: "Karachi",
      country: "Pakistan",
      lon: 67.0011,
      lat: 24.8607,
      floodRisk: 0.65,
      heatRisk: 0.75,
    },
    {
      name: "Bangkok",
      country: "Thailand",
      lon: 100.5018,
      lat: 13.7563,
      floodRisk: 0.8,
      heatRisk: 0.7,
    },
    {
      name: "Seoul",
      country: "South Korea",
      lon: 126.978,
      lat: 37.5665,
      floodRisk: 0.4,
      heatRisk: 0.45,
    },
    {
      name: "Beijing",
      country: "China",
      lon: 116.4074,
      lat: 39.9042,
      floodRisk: 0.35,
      heatRisk: 0.5,
    },
  ];

  useEffect(() => {
    setCities(globalRiskData || defaultCities);
  }, [globalRiskData]);

  // Get color based on risk level
  const getRiskColor = (city) => {
    const risk = activeRisk === "flood" ? city.floodRisk : city.heatRisk;

    if (risk > 0.7) return "#ff5252"; // Critical - Red
    if (risk > 0.4) return "#ffeb3b"; // Moderate - Yellow
    return "#4caf50"; // Low - Green
  };

  // Get risk level text
  const getRiskLevel = (risk) => {
    if (risk > 0.7) return "CRITICAL";
    if (risk > 0.4) return "MODERATE";
    return "LOW";
  };

  return (
    <div className="cesium-globe-container">
      <div ref={containerRef} className="cesium-globe">
        {/* Cesium canvas placeholder - In production, this would be the actual Cesium viewer */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at 30% 30%, #1a3a5a, #0a1a2f)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Grid lines for globe effect */}
          <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(79, 195, 247, 0.1)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* City markers */}
          {cities.map((city, index) => {
            // Convert lat/lon to screen position (simplified projection)
            const x = ((city.lon + 180) / 360) * 100;
            const y = ((90 - city.lat) / 180) * 100;
            const risk =
              activeRisk === "flood" ? city.floodRisk : city.heatRisk;
            const color = getRiskColor(city);

            return (
              <div
                key={index}
                className="city-marker"
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  zIndex: 10,
                }}
                title={`${city.name}\nRisk: ${Math.round(risk * 100)}% (${getRiskLevel(risk)})`}
              >
                <div
                  style={{
                    width: risk > 0.7 ? "16px" : "12px",
                    height: risk > 0.7 ? "16px" : "12px",
                    background: color,
                    borderRadius: "50%",
                    boxShadow: `0 0 20px ${color}`,
                    animation: risk > 0.7 ? "pulse 1.5s infinite" : "none",
                    border: "2px solid white",
                    transition: "all 0.3s",
                  }}
                />

                {/* Risk circle */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: risk * 100 + "px",
                    height: risk * 100 + "px",
                    background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            );
          })}

          {/* City labels */}
          {cities.map((city, index) => {
            const x = ((city.lon + 180) / 360) * 100;
            const y = ((90 - city.lat) / 180) * 100;

            return (
              <div
                key={`label-${index}`}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y + 2}%`,
                  transform: "translateX(-50%)",
                  color: "white",
                  fontSize: "10px",
                  textShadow: "1px 1px 2px black",
                  whiteSpace: "nowrap",
                  background: "rgba(0,0,0,0.5)",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                {city.name}
              </div>
            );
          })}
        </div>
      </div>

      <div className="globe-controls">
        <h4>🌍 Global Risk Visualization</h4>
        <div className="risk-toggle">
          <button
            className={activeRisk === "flood" ? "active" : ""}
            onClick={() => setActiveRisk("flood")}
          >
            <span style={{ marginRight: "5px" }}>🌊</span>
            Flood Risk
          </button>
          <button
            className={activeRisk === "heat" ? "active" : ""}
            onClick={() => setActiveRisk("heat")}
          >
            <span style={{ marginRight: "5px" }}>🔥</span>
            Heat Risk
          </button>
        </div>
        <div className="city-count">
          Monitoring {cities.length} major cities
        </div>
        <button className="refresh-btn" onClick={onRefresh}>
          <span style={{ marginRight: "5px" }}>🔄</span>
          Refresh Data
        </button>
      </div>

      <div className="legend-panel">
        <h4>Risk Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color red"></div>
            <span>Critical Risk (&gt;70%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color yellow"></div>
            <span>Moderate Risk (40-70%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color green"></div>
            <span>Low Risk (&lt;40%)</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CesiumGlobe;
