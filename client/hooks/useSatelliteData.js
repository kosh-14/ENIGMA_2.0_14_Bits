// client/src/hooks/useSatelliteData.js
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config"; // ← ADD THIS LINE AT THE TOP

const DEFAULT_BBOX = [-122.5, 37.7, -122.3, 37.9];

export const useSatelliteData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedBand, setSelectedBand] = useState("truecolor");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // REPLACE this line:
      // const response = await axios.post(`http://localhost:3000/api/satellite-data`, {

      // WITH this line:
      const response = await axios.post(`${API_URL}/satellite-data`, {
        bbox: DEFAULT_BBOX,
        options: { width: 512, height: 512 },
      });

      if (response.data.success) {
        setData(response.data.data);
        setIsLive(true);
      }
    } catch (error) {
      console.error("Using simulated data:", error);
      setData({
        truecolor:
          "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/Global_urban_areas_2000_lrg.jpg",
        analysis: {
          ndvi: 0.45,
          ndwi: 0.23,
          surfaceTemperature: "24.5",
          cloudCoverage: 15,
        },
      });
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    isLive,
    selectedBand,
    setSelectedBand,
    refresh: loadData,
  };
};
