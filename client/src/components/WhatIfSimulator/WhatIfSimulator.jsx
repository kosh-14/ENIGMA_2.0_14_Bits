import React, { useState } from "react";
import CityView3D from "./CityView3D";
import FloodSimulation from "./FloodSimulation";
import HeatIslandSimulation from "./HeatIslandSimulation";
import SimulationControls from "./SimulationControls";
import "./WhatIfSimulator.css";

const WhatIfSimulator = ({ simulationType: initialType }) => {
  const [activeSimulation, setActiveSimulation] = useState(
    initialType || "flood",
  );
  const [floodLevel, setFloodLevel] = useState(0);
  const [heatIntensity, setHeatIntensity] = useState(0);
  const [greenCover, setGreenCover] = useState(15);
  const [buildingDensity, setBuildingDensity] = useState(70);
  const [scenarioName, setScenarioName] = useState("Baseline");

  // Handle scenario presets
  const scenarios = {
    baseline: {
      floodLevel: 0,
      heatIntensity: 0,
      greenCover: 15,
      buildingDensity: 70,
      name: "Baseline",
    },
    flashFlood: {
      floodLevel: 75,
      heatIntensity: 10,
      greenCover: 15,
      buildingDensity: 70,
      name: "Flash Flood Event",
    },
    heatwave: {
      floodLevel: 0,
      heatIntensity: 80,
      greenCover: 10,
      buildingDensity: 70,
      name: "Extreme Heatwave",
    },
    greenCity: {
      floodLevel: 0,
      heatIntensity: -30,
      greenCover: 35,
      buildingDensity: 60,
      name: "+20% Green Cover",
    },
    climateChange: {
      floodLevel: 40,
      heatIntensity: 50,
      greenCover: 10,
      buildingDensity: 80,
      name: "Climate Change Scenario",
    },
  };

  const applyScenario = (scenarioKey) => {
    const scenario = scenarios[scenarioKey];
    setFloodLevel(scenario.floodLevel);
    setHeatIntensity(scenario.heatIntensity);
    setGreenCover(scenario.greenCover);
    setBuildingDensity(scenario.buildingDensity);
    setScenarioName(scenario.name);
  };

  // Calculate impact metrics
  const calculateImpact = () => {
    let floodImpact = 0;
    let heatImpact = 0;
    let combinedRisk = 0;

    // Flood impact calculation
    if (floodLevel > 0) {
      floodImpact = (floodLevel / 100) * 100;
    }

    // Heat island impact calculation
    if (heatIntensity > 0) {
      heatImpact = (heatIntensity / 100) * 100;
    } else if (heatIntensity < 0) {
      heatImpact = 0; // Cooling effect from green cover
    }

    // Combined risk (weighted average)
    combinedRisk = floodImpact * 0.5 + heatImpact * 0.5;

    return {
      floodImpact: Math.round(floodImpact),
      heatImpact: Math.round(heatImpact),
      combinedRisk: Math.round(combinedRisk),
      buildingsAffected: Math.round(42 * (floodImpact / 100)),
      vulnerablePopulation: Math.round(12500 * (combinedRisk / 100)),
      economicLoss: Math.round(combinedRisk * 2.5 * 10) / 10,
    };
  };

  const impact = calculateImpact();

  return (
    <div className="what-if-simulator">
      <div className="simulator-header">
        <h2>🏙️ WHAT-IF SCENARIO SIMULATOR</h2>
        <div className="scenario-badge">{scenarioName}</div>
      </div>

      {/* Simulation Toggle */}
      <div className="simulation-toggle">
        <button
          className={`toggle-btn ${activeSimulation === "flood" ? "active" : ""}`}
          onClick={() => setActiveSimulation("flood")}
        >
          <span className="btn-icon">🌊</span>
          FLOOD SIMULATION
        </button>
        <button
          className={`toggle-btn ${activeSimulation === "heat" ? "active" : ""}`}
          onClick={() => setActiveSimulation("heat")}
        >
          <span className="btn-icon">🔥</span>
          HEAT ISLAND SIMULATION
        </button>
        <button
          className={`toggle-btn ${activeSimulation === "combined" ? "active" : ""}`}
          onClick={() => setActiveSimulation("combined")}
        >
          <span className="btn-icon">🌊🔥</span>
          COMBINED EFFECT
        </button>
      </div>

      {/* Main simulator grid */}
      <div className="simulator-grid">
        {/* Left side - 3D City View */}
        <div className="city-view-container">
          <CityView3D
            floodLevel={floodLevel}
            heatIntensity={heatIntensity}
            activeSimulation={activeSimulation}
            greenCover={greenCover}
            buildingDensity={buildingDensity}
          />
        </div>

        {/* Right side - Controls and Metrics */}
        <div className="controls-container">
          {/* Active simulation panel */}
          <div className="simulation-panel">
            {activeSimulation === "flood" && (
              <FloodSimulation
                floodLevel={floodLevel}
                setFloodLevel={setFloodLevel}
              />
            )}
            {activeSimulation === "heat" && (
              <HeatIslandSimulation
                heatIntensity={heatIntensity}
                setHeatIntensity={setHeatIntensity}
                greenCover={greenCover}
                setGreenCover={setGreenCover}
              />
            )}
            {activeSimulation === "combined" && (
              <div className="combined-panel">
                <FloodSimulation
                  floodLevel={floodLevel}
                  setFloodLevel={setFloodLevel}
                  compact
                />
                <HeatIslandSimulation
                  heatIntensity={heatIntensity}
                  setHeatIntensity={setHeatIntensity}
                  greenCover={greenCover}
                  setGreenCover={setGreenCover}
                  compact
                />
              </div>
            )}
          </div>

          {/* Scenario presets */}
          <SimulationControls
            applyScenario={applyScenario}
            scenarios={scenarios}
          />

          {/* Impact metrics */}
          <div className="impact-metrics">
            <h3>📊 PREDICTED IMPACT</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">🌊 Flood Impact</div>
                <div className="metric-value">{impact.floodImpact}%</div>
                <div className="progress-bar">
                  <div
                    className="progress-fill flood"
                    style={{ width: `${impact.floodImpact}%` }}
                  ></div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">🔥 Heat Island</div>
                <div className="metric-value">{impact.heatImpact}%</div>
                <div className="progress-bar">
                  <div
                    className="progress-fill heat"
                    style={{ width: `${impact.heatImpact}%` }}
                  ></div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">🏢 Buildings Affected</div>
                <div className="metric-value">{impact.buildingsAffected}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">👥 Vulnerable Population</div>
                <div className="metric-value">
                  {impact.vulnerablePopulation.toLocaleString()}
                </div>
              </div>
              <div className="metric-card highlight">
                <div className="metric-label">⚠️ COMBINED RISK</div>
                <div className="metric-value">{impact.combinedRisk}%</div>
                <div className="risk-indicator">
                  <div
                    className={`risk-level ${impact.combinedRisk < 30 ? "low" : impact.combinedRisk < 60 ? "moderate" : "critical"}`}
                  >
                    {impact.combinedRisk < 30
                      ? "LOW"
                      : impact.combinedRisk < 60
                        ? "MODERATE"
                        : "CRITICAL"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
