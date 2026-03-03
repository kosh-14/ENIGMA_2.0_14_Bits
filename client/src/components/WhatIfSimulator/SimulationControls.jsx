import React from "react";

const SimulationControls = ({ applyScenario, scenarios }) => {
  return (
    <div className="simulation-controls">
      <h3>🎮 SCENARIO PRESETS</h3>
      <div className="scenario-grid">
        <button
          className="scenario-card"
          onClick={() => applyScenario("baseline")}
        >
          <span className="scenario-icon">🌆</span>
          <span className="scenario-name">Baseline</span>
          <span className="scenario-desc">Current conditions</span>
        </button>

        <button
          className="scenario-card flash-flood"
          onClick={() => applyScenario("flashFlood")}
        >
          <span className="scenario-icon">🌊</span>
          <span className="scenario-name">Flash Flood</span>
          <span className="scenario-desc">75% flood level</span>
        </button>

        <button
          className="scenario-card heatwave"
          onClick={() => applyScenario("heatwave")}
        >
          <span className="scenario-icon">🔥</span>
          <span className="scenario-name">Heatwave</span>
          <span className="scenario-desc">+8°C temperature</span>
        </button>

        <button
          className="scenario-card green"
          onClick={() => applyScenario("greenCity")}
        >
          <span className="scenario-icon">🌳</span>
          <span className="scenario-name">Green City</span>
          <span className="scenario-desc">+20% green cover</span>
        </button>

        <button
          className="scenario-card climate"
          onClick={() => applyScenario("climateChange")}
        >
          <span className="scenario-icon">🌍</span>
          <span className="scenario-name">Climate Change</span>
          <span className="scenario-desc">Combined effects</span>
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
