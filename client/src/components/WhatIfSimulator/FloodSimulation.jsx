import React from "react";

const FloodSimulation = ({ floodLevel, setFloodLevel, compact = false }) => {
  return (
    <div className={`simulation-module ${compact ? "compact" : ""}`}>
      <h3>
        <span className="module-icon">🌊</span>
        FLOOD PARAMETERS
      </h3>

      <div className="parameter">
        <label>
          Water Level <span className="param-value">{floodLevel}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={floodLevel}
          onChange={(e) => setFloodLevel(parseInt(e.target.value))}
          className="flood-slider"
        />
        <div className="slider-markers">
          <span>0%</span>
          <span className="marker-25">25%</span>
          <span className="marker-50">50%</span>
          <span className="marker-75">75%</span>
          <span>100%</span>
        </div>
      </div>

      {!compact && (
        <>
          <div className="flood-depth-indicator">
            <div className="depth-scale">
              <div
                className="depth-marker"
                style={{ bottom: `${floodLevel}%` }}
              >
                <span className="depth-value">
                  {Math.round(floodLevel * 0.0365 * 100) / 100}m
                </span>
              </div>
            </div>
            <div className="depth-labels">
              <span>3.65m (Max)</span>
              <span>1.83m</span>
              <span>0m</span>
            </div>
          </div>

          <div className="flood-info">
            <div className="info-item">
              <span>Flood Zone Type:</span>
              <span className="info-value">
                {floodLevel < 30
                  ? "Minor"
                  : floodLevel < 60
                    ? "Moderate"
                    : "Major"}
              </span>
            </div>
            <div className="info-item">
              <span>Estimated Duration:</span>
              <span className="info-value">
                {floodLevel < 30
                  ? "6-12 hrs"
                  : floodLevel < 60
                    ? "24-48 hrs"
                    : "72+ hrs"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloodSimulation;
