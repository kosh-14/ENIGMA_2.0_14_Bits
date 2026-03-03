import React from "react";

const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <div className="loading-message">{message}</div>
      <div className="loading-submessage">Connecting to Sentinel Hub...</div>
    </div>
  );
};

export default LoadingOverlay;
