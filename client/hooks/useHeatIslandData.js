// client/src/hooks/useHeatIslandData.js
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config"; // ← ADD THIS LINE AT THE TOP

export const useHeatIslandData = (bbox) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeHeat = async (customBbox) => {
    try {
      setLoading(true);
      // REPLACE this line:
      // const response = await axios.post(`http://localhost:3000/api/heat-analysis`, {

      // WITH this line:
      const response = await axios.post(`${API_URL}/heat-analysis`, {
        bbox: customBbox || bbox,
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Heat analysis failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, analyzeHeat };
};
