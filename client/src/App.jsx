import React, { useState, useEffect } from "react";
import WhatIfSimulator from "./components/WhatIfSimulator/WhatIfSimulator";
import CesiumGlobe from "./components/CesiumGlobe/CesiumGlobe";
import LoadingOverlay from "./components/Shared/LoadingOverlay";
import "./styles/App.css";
import { API_URL } from "./config"; 

function App() {
  const [activeSection, setActiveSection] = useState("simulator");
  const [simulationType, setSimulationType] = useState("flood");
  const [loading, setLoading] = useState(true);
  const [globalRiskData, setGlobalRiskData] = useState(null);
  const [satelliteData, setSatelliteData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch global risk data on mount
  useEffect(() => {
    fetchGlobalRiskData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchGlobalRiskData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchGlobalRiskData = async () => {
    try {
      const response = await fetch(`${API_URL}/global-risk-data`);
      const data = await response.json();
      if (data.success) {
        setGlobalRiskData(data.data);
        setLastUpdate(new Date());
        setIsLive(true);
      }
    } catch (error) {
      console.error("Failed to fetch global risk data:", error);
      setIsLive(false);
    }
  };

  return (
    <div className="app-container">
      {loading && <LoadingOverlay message="Initializing Digital Twin..." />}

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🌍</span>
            <h1>RESILIENT CITY DIGITAL TWIN</h1>
          </div>
          <div className="sdg-badge">SDG 11: SUSTAINABLE CITIES</div>
        </div>

        <div className="header-right">
          <div className="live-indicator">
            <span className="pulse-dot"></span>
            <span>SENTINEL-2 LIVE</span>
          </div>
          <div className="timestamp">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeSection === "simulator" ? "active" : ""}`}
          onClick={() => setActiveSection("simulator")}
        >
          <span className="tab-icon">🏙️</span>
          <span className="tab-label">WHAT-IF SIMULATOR</span>
          <span className="tab-desc">
            Interactive 3D city with flood & heat simulation
          </span>
        </button>
        <button
          className={`nav-tab ${activeSection === "globe" ? "active" : ""}`}
          onClick={() => setActiveSection("globe")}
        >
          <span className="tab-icon">🌐</span>
          <span className="tab-label">CESIUM GLOBE</span>
          <span className="tab-desc">
            Global risk visualization with Sentinel data
          </span>
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {activeSection === "simulator" ? (
          <WhatIfSimulator
            simulationType={simulationType}
            setSimulationType={setSimulationType}
            satelliteData={satelliteData}
          />
        ) : (
          <CesiumGlobe
            globalRiskData={globalRiskData}
            onRefresh={fetchGlobalRiskData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-left">
          <span>🛰️ Data Sources: Sentinel-2 | Landsat-8 | MODIS | ECMWF</span>
        </div>
        <div className="footer-right">
          <span>
            🔬 Scientific Models: RRI v2.0 | Urban Canyon | Wetland BGC
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
