import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const useSatelliteData = (bbox = [-122.5, 37.7, -122.3, 37.9]) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [JSON.stringify(bbox)]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/satellite-data`, {
        bbox,
        options: { width: 512, height: 512 },
      });

      if (response.data.success) {
        setData(response.data.data);
        setIsLive(true);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch satellite data:", err);
      setError(err.message);
      setIsLive(false);

      // Set mock data as fallback
      setData({
        truecolor:
          "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/Global_urban_areas_2000_lrg.jpg",
        analysis: {
          ndvi: 0.45,
          ndwi: 0.23,
          ndbi: 0.35,
          lst: 28.5,
          floodRisk: 0.3,
          heatRisk: 0.5,
          waterPercentage: 18,
          vegetationPercentage: 42,
          urbanPercentage: 28,
          barePercentage: 12,
          cloudCoverage: 15,
          surfaceTemperature: 28.5,
          floodDepth: 0.5,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, isLive, refresh: fetchData };
};
