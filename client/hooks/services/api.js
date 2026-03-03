// client/src/services/api.js
import axios from "axios";
import { API_URL } from "../config"; // ← ADD THIS LINE AT THE TOP

export const api = {
  // Health check
  checkHealth: async () => {
    try {
      // REPLACE this line:
      // const response = await axios.get(`http://localhost:3000/api/health`);

      // WITH this line:
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      return { status: "unhealthy" };
    }
  },

  // Satellite data
  getSatelliteData: async (bbox, options = {}) => {
    try {
      // REPLACE this line:
      // const response = await axios.post(`http://localhost:3000/api/satellite-data`, {

      // WITH this line:
      const response = await axios.post(`${API_URL}/satellite-data`, {
        bbox,
        options: {
          width: 512,
          height: 512,
          maxCloudCoverage: 30,
          ...options,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Flood analysis
  analyzeFlood: async (bbox) => {
    try {
      // REPLACE this line:
      // const response = await axios.post(`http://localhost:3000/api/flood-analysis`, { bbox });

      // WITH this line:
      const response = await axios.post(`${API_URL}/flood-analysis`, { bbox });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Heat island analysis
  analyzeHeat: async (bbox) => {
    try {
      // REPLACE this line:
      // const response = await axios.post(`http://localhost:3000/api/heat-analysis`, { bbox });

      // WITH this line:
      const response = await axios.post(`${API_URL}/heat-analysis`, { bbox });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Global risk data
  getGlobalRiskData: async () => {
    try {
      // REPLACE this line:
      // const response = await axios.get(`http://localhost:3000/api/global-risk-data`);

      // WITH this line:
      const response = await axios.get(`${API_URL}/global-risk-data`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Region risk data
  getRegionRisk: async (lat, lon, radius) => {
    try {
      // REPLACE this line:
      // const response = await axios.get(`http://localhost:3000/api/region-risk/${lat}/${lon}/${radius}`);

      // WITH this line:
      const response = await axios.get(
        `${API_URL}/region-risk/${lat}/${lon}/${radius}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
