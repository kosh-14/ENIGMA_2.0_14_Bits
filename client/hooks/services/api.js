import axios from "axios";

const API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3000/api";

export const api = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      return { status: "unhealthy" };
    }
  },

  // Satellite data
  getSatelliteData: async (bbox, options = {}) => {
    try {
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
      const response = await axios.post(`${API_URL}/flood-analysis`, { bbox });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Heat island analysis
  analyzeHeat: async (bbox) => {
    try {
      const response = await axios.post(`${API_URL}/heat-analysis`, { bbox });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Global risk data
  getGlobalRiskData: async () => {
    try {
      const response = await axios.get(`${API_URL}/global-risk-data`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Region risk data
  getRegionRisk: async (lat, lon, radius) => {
    try {
      const response = await axios.get(
        `${API_URL}/region-risk/${lat}/${lon}/${radius}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cache management
  clearCache: async () => {
    try {
      const response = await axios.post(`${API_URL}/cache/clear`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCacheStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/cache/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
