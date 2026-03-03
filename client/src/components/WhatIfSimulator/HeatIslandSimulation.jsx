import React from "react";

const HeatIslandSimulation = ({
  heatIntensity,
  setHeatIntensity,
  greenCover,
  setGreenCover,
  compact = false,
}) => {
  // Calculate temperature based on heat intensity and green cover
  const baseTemp = 28;
  const heatEffect = (heatIntensity / 100) * 12;
  const coolingEffect = (greenCover / 100) * 8;
  const currentTemp = baseTemp + heatEffect - coolingEffect;

  return (
    <div className={`simulation-module ${compact ? "compact" : ""}`}>
      <h3>
        <span className="module-icon">🔥</span>
        HEAT ISLAND PARAMETERS
      </h3>

      <div className="parameter">
        <label>
          Heat Intensity <span className="param-value">{heatIntensity}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={heatIntensity}
          onChange={(e) => setHeatIntensity(parseInt(e.target.value))}
          className="heat-slider"
        />
      </div>

      <div className="parameter">
        <label>
          Green Cover <span className="param-value">{greenCover}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={greenCover}
          onChange={(e) => setGreenCover(parseInt(e.target.value))}
          className="green-slider"
        />
      </div>

      <div className="temperature-display">
        <div className="temp-circle">
          <span className="temp-value">
            {Math.round(currentTemp * 10) / 10}°C
          </span>
          <span className="temp-label">Surface Temp</span>
        </div>
        <div className="temp-details">
          <div className="temp-effect">
            <span>🔥 +{Math.round(heatEffect * 10) / 10}°C</span>
          </div>
          <div className="temp-effect">
            <span>🌿 -{Math.round(coolingEffect * 10) / 10}°C</span>
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="heat-info">
            <div className="info-item">
              <span>Heat Island Category:</span>
              <span className="info-value">
                {currentTemp < 32
                  ? "Low"
                  : currentTemp < 36
                    ? "Moderate"
                    : "Severe"}
              </span>
            </div>
            <div className="info-item">
              <span>Vulnerable Areas:</span>
              <span className="info-value">
                {Math.round((100 - greenCover) * 0.4)}% of city
              </span>
            </div>
          </div>

          <div className="heat-recommendations">
            <h4>🌳 RECOMMENDATIONS</h4>
            <ul>
              <li>Add {Math.max(0, 30 - greenCover)}% more green cover</li>
              <li>Use cool pavement materials</li>
              <li>Create shaded pedestrian corridors</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default HeatIslandSimulation;
