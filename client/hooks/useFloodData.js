import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const useFloodData = (bbox) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeFlood = async (customBbox) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/flood-analysis`, {
        bbox: customBbox || bbox,
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Flood analysis failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, analyzeFlood };
};
