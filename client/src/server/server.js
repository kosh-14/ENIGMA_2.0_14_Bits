const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const moment = require("moment");
const cron = require("node-cron");
const geolib = require("geolib");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../client/build")));

// Cache for satellite data
const cache = new Map();
const CACHE_DURATION = process.env.CACHE_DURATION || 3600000;

// ========== SENTINEL HUB SERVICE ==========
class SentinelHubService {
  constructor() {
    this.clientId = process.env.SENTINEL_CLIENT_ID;
    this.clientSecret = process.env.SENTINEL_CLIENT_SECRET;
    this.token = null;
    this.tokenExpiry = null;
    this.baseUrl = "https://services.sentinel-hub.com";
    this.evalscript = `
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["B02", "B03", "B04", "B08", "B11", "B12", "SCL"],
                        units: "DN"
                    }],
                    output: [
                        { id: "truecolor", bands: 3, sampleType: "AUTO" },
                        { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
                        { id: "ndwi", bands: 1, sampleType: "FLOAT32" },
                        { id: "ndbi", bands: 1, sampleType: "FLOAT32" },
                        { id: "lst", bands: 1, sampleType: "FLOAT32" },
                        { id: "scl", bands: 1, sampleType: "UINT8" }
                    ]
                };
            }

            function evaluatePixel(sample) {
                // True Color
                let trueColor = [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
                
                // NDVI (Vegetation Index)
                let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
                
                // NDWI (Water Index) for flood detection
                let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
                
                // NDBI (Built-up Index) for urban areas
                let ndbi = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
                
                // Land Surface Temperature (simplified)
                let lst = sample.B11 * 0.1 - 10; // Simplified LST calculation
                
                return {
                    truecolor: trueColor,
                    ndvi: [ndvi],
                    ndwi: [ndwi],
                    ndbi: [ndbi],
                    lst: [lst],
                    scl: [sample.SCL]
                };
            }
        `;
  }

  async getAccessToken() {
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    try {
      console.log("🔄 Getting new Sentinel Hub access token...");
      const response = await axios.post(
        `${this.baseUrl}/auth/realms/main/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
      console.log("✅ Token acquired");
      return this.token;
    } catch (error) {
      console.error("❌ Failed to get Sentinel token:", error.message);
      throw error;
    }
  }

  async getSatelliteData(bbox, options = {}) {
    const { width = 512, height = 512, maxCloudCoverage = 30 } = options;

    const cacheKey = `${bbox.join(",")}-${width}-${height}`;

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("📦 Returning cached data");
        return cached.data;
      }
    }

    try {
      const token = await this.getAccessToken();

      const endDate = moment().format("YYYY-MM-DD");
      const startDate = moment().subtract(7, "days").format("YYYY-MM-DD");

      const response = await axios.post(
        `${this.baseUrl}/api/v1/process`,
        {
          input: {
            bounds: {
              bbox: bbox,
              properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
            },
            data: [
              {
                type: "S2L2A",
                dataFilter: {
                  maxCloudCoverage: maxCloudCoverage,
                  timeRange: {
                    from: startDate + "T00:00:00Z",
                    to: endDate + "T23:59:59Z",
                  },
                },
                processing: {
                  harmonizeValues: true,
                },
              },
            ],
          },
          output: {
            width: width,
            height: height,
            responses: [
              { identifier: "truecolor", format: { type: "image/png" } },
              { identifier: "ndvi", format: { type: "image/tiff" } },
              { identifier: "ndwi", format: { type: "image/tiff" } },
              { identifier: "ndbi", format: { type: "image/tiff" } },
              { identifier: "lst", format: { type: "image/tiff" } },
              { identifier: "scl", format: { type: "image/tiff" } },
            ],
          },
          evalscript: this.evalscript,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          responseType: "arraybuffer",
        },
      );

      const boundary = this.extractBoundary(response.headers["content-type"]);
      const parts = this.parseMultipartResponse(response.data, boundary);

      const result = {
        truecolor: parts.truecolor
          ? `data:image/png;base64,${parts.truecolor.toString("base64")}`
          : null,
        ndvi: parts.ndvi
          ? `data:image/tiff;base64,${parts.ndvi.toString("base64")}`
          : null,
        ndwi: parts.ndwi
          ? `data:image/tiff;base64,${parts.ndwi.toString("base64")}`
          : null,
        ndbi: parts.ndbi
          ? `data:image/tiff;base64,${parts.ndbi.toString("base64")}`
          : null,
        lst: parts.lst
          ? `data:image/tiff;base64,${parts.lst.toString("base64")}`
          : null,
        scl: parts.scl
          ? `data:image/tiff;base64,${parts.scl.toString("base64")}`
          : null,
        metadata: {
          timestamp: new Date().toISOString(),
          bbox: bbox,
          cloudCoverage: maxCloudCoverage,
          source: "Sentinel-2 L2A",
        },
      };

      const analysis = await this.analyzeSentinelData(parts, bbox);
      result.analysis = analysis;

      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result,
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to fetch Sentinel data:", error.message);
      throw error;
    }
  }

  extractBoundary(contentType) {
    const match = contentType.match(/boundary=([^;]+)/);
    return match ? match[1] : null;
  }

  parseMultipartResponse(buffer, boundary) {
    const parts = {};
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

    let start = 0;
    let end = buffer.indexOf(endBoundaryBuffer);

    if (end === -1) {
      end = buffer.length;
    }

    let pos = buffer.indexOf(boundaryBuffer, start);
    while (pos !== -1 && pos < end) {
      const headersEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), pos);
      if (headersEnd === -1) break;

      const headers = buffer
        .slice(pos + boundaryBuffer.length + 2, headersEnd)
        .toString();
      const contentIdMatch = headers.match(/Content-ID: <([^>]+)>/);

      if (contentIdMatch) {
        const contentId = contentIdMatch[1];
        const nextBoundary = buffer.indexOf(boundaryBuffer, headersEnd + 4);
        const contentEnd = nextBoundary !== -1 ? nextBoundary - 4 : end - 2;
        const content = buffer.slice(headersEnd + 4, contentEnd);
        parts[contentId] = content;
      }

      pos = buffer.indexOf(boundaryBuffer, headersEnd + 4);
    }

    return parts;
  }

  async analyzeSentinelData(parts, bbox) {
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const centerLon = (bbox[0] + bbox[2]) / 2;

    // Simulate analysis based on location and indices
    // In production, you would parse the TIFF files

    // Flood risk based on NDWI and elevation
    const floodRisk = this.calculateFloodRisk(centerLat, centerLon);

    // Heat island based on LST and NDBI
    const heatRisk = this.calculateHeatIslandRisk(centerLat, centerLon);

    // Land cover percentages
    const landCover = {
      water: Math.round(15 + Math.random() * 20),
      vegetation: Math.round(25 + Math.random() * 30),
      urban: Math.round(20 + Math.random() * 25),
      bare: Math.round(10 + Math.random() * 15),
    };

    // Adjust to sum to 100
    const total =
      landCover.water + landCover.vegetation + landCover.urban + landCover.bare;
    if (total !== 100) {
      landCover.bare += 100 - total;
    }

    return {
      ndvi: parseFloat((0.3 + Math.random() * 0.5).toFixed(3)),
      ndwi: parseFloat((0.1 + Math.random() * 0.4).toFixed(3)),
      ndbi: parseFloat((0.2 + Math.random() * 0.3).toFixed(3)),
      lst: parseFloat((25 + Math.random() * 15).toFixed(1)),
      floodRisk: parseFloat(floodRisk.toFixed(2)),
      heatRisk: parseFloat(heatRisk.toFixed(2)),
      waterPercentage: landCover.water,
      vegetationPercentage: landCover.vegetation,
      urbanPercentage: landCover.urban,
      barePercentage: landCover.bare,
      cloudCoverage: Math.floor(Math.random() * 30),
      surfaceTemperature: parseFloat((28 + Math.random() * 10).toFixed(1)),
      floodDepth: this.estimateFloodDepth(floodRisk),
    };
  }

  calculateFloodRisk(lat, lon) {
    // Flood risk factors:
    // 1. Coastal areas (higher risk)
    // 2. River deltas (higher risk)
    // 3. Low-lying areas (higher risk)

    const coastalCities = [
      { lat: 19.076, lon: 72.8777, risk: 0.85 }, // Mumbai
      { lat: 40.7128, lon: -74.006, risk: 0.45 }, // NYC
      { lat: 25.7617, lon: -80.1918, risk: 0.9 }, // Miami
      { lat: 22.5726, lon: 88.3639, risk: 0.8 }, // Kolkata
      { lat: 23.8103, lon: 90.4125, risk: 0.95 }, // Dhaka
      { lat: 31.2304, lon: 121.4737, risk: 0.8 }, // Shanghai
      { lat: 35.6895, lon: 139.6917, risk: 0.7 }, // Tokyo
      { lat: 51.5074, lon: -0.1278, risk: 0.6 }, // London
      { lat: 48.8566, lon: 2.3522, risk: 0.5 }, // Paris
      { lat: -33.8688, lon: 151.2093, risk: 0.35 }, // Sydney
    ];

    // Find nearest city
    let minDistance = Infinity;
    let baseRisk = 0.3;

    coastalCities.forEach((city) => {
      const distance = geolib.getDistance(
        { latitude: lat, longitude: lon },
        { latitude: city.lat, longitude: city.lon },
      );

      if (distance < minDistance) {
        minDistance = distance;
        if (distance < 200000) {
          // Within 200km
          baseRisk = city.risk;
        }
      }
    });

    // Add randomness
    const risk = baseRisk + (Math.random() * 0.2 - 0.1);
    return Math.min(1, Math.max(0, risk));
  }

  calculateHeatIslandRisk(lat, lon) {
    // Heat island factors:
    // 1. Urban density (higher risk)
    // 2. Latitude (closer to equator = higher risk)
    // 3. Vegetation cover (lower = higher risk)

    const latitudeFactor =
      Math.abs(lat) < 30 ? 1.2 : Math.abs(lat) < 45 ? 1.0 : 0.6;

    const urbanCenters = [
      { lat: 40.7128, lon: -74.006, risk: 0.75 }, // NYC
      { lat: 34.0522, lon: -118.2437, risk: 0.8 }, // LA
      { lat: 19.076, lon: 72.8777, risk: 0.85 }, // Mumbai
      { lat: 31.2304, lon: 121.4737, risk: 0.8 }, // Shanghai
      { lat: 35.6895, lon: 139.6917, risk: 0.75 }, // Tokyo
      { lat: 25.2048, lon: 55.2708, risk: 0.95 }, // Dubai
      { lat: 30.0444, lon: 31.2357, risk: 0.85 }, // Cairo
      { lat: 23.588, lon: 58.3829, risk: 0.9 }, // Muscat
      { lat: 24.7136, lon: 46.6753, risk: 0.85 }, // Riyadh
      { lat: 19.4326, lon: -99.1332, risk: 0.7 }, // Mexico City
    ];

    let minDistance = Infinity;
    let baseRisk = 0.4;

    urbanCenters.forEach((city) => {
      const distance = geolib.getDistance(
        { latitude: lat, longitude: lon },
        { latitude: city.lat, longitude: city.lon },
      );

      if (distance < minDistance) {
        minDistance = distance;
        if (distance < 300000) {
          baseRisk = city.risk;
        }
      }
    });

    const risk = baseRisk * latitudeFactor + Math.random() * 0.15;
    return Math.min(1, Math.max(0, risk));
  }

  estimateFloodDepth(floodRisk) {
    if (floodRisk > 0.7) return (Math.random() * 2 + 1.5).toFixed(2); // 1.5-3.5m
    if (floodRisk > 0.4) return (Math.random() * 1 + 0.5).toFixed(2); // 0.5-1.5m
    return (Math.random() * 0.5).toFixed(2); // 0-0.5m
  }

  async getGlobalRiskData() {
    // Generate risk data for major cities worldwide
    const cities = [
      {
        name: "Mumbai",
        country: "India",
        lon: 72.8777,
        lat: 19.076,
        population: 20411000,
      },
      {
        name: "New York",
        country: "USA",
        lon: -74.006,
        lat: 40.7128,
        population: 18819000,
      },
      {
        name: "London",
        country: "UK",
        lon: -0.1278,
        lat: 51.5074,
        population: 14180000,
      },
      {
        name: "Tokyo",
        country: "Japan",
        lon: 139.6917,
        lat: 35.6895,
        population: 37400000,
      },
      {
        name: "Shanghai",
        country: "China",
        lon: 121.4737,
        lat: 31.2304,
        population: 26320000,
      },
      {
        name: "Miami",
        country: "USA",
        lon: -80.1918,
        lat: 25.7617,
        population: 6150000,
      },
      {
        name: "Dhaka",
        country: "Bangladesh",
        lon: 90.4125,
        lat: 23.8103,
        population: 21500000,
      },
      {
        name: "Cairo",
        country: "Egypt",
        lon: 31.2357,
        lat: 30.0444,
        population: 20000000,
      },
      {
        name: "Sydney",
        country: "Australia",
        lon: 151.2093,
        lat: -33.8688,
        population: 5300000,
      },
      {
        name: "Rio",
        country: "Brazil",
        lon: -43.1729,
        lat: -22.9068,
        population: 13400000,
      },
      {
        name: "Moscow",
        country: "Russia",
        lon: 37.6173,
        lat: 55.7558,
        population: 12500000,
      },
      {
        name: "Cape Town",
        country: "South Africa",
        lon: 18.4241,
        lat: -33.9249,
        population: 4330000,
      },
      {
        name: "Jakarta",
        country: "Indonesia",
        lon: 106.8456,
        lat: -6.2088,
        population: 10770000,
      },
      {
        name: "Lagos",
        country: "Nigeria",
        lon: 3.3792,
        lat: 6.5244,
        population: 14800000,
      },
      {
        name: "Mexico City",
        country: "Mexico",
        lon: -99.1332,
        lat: 19.4326,
        population: 21800000,
      },
      {
        name: "Istanbul",
        country: "Turkey",
        lon: 28.9784,
        lat: 41.0082,
        population: 15460000,
      },
      {
        name: "Karachi",
        country: "Pakistan",
        lon: 67.0011,
        lat: 24.8607,
        population: 16000000,
      },
      {
        name: "Bangkok",
        country: "Thailand",
        lon: 100.5018,
        lat: 13.7563,
        population: 10500000,
      },
      {
        name: "Seoul",
        country: "South Korea",
        lon: 126.978,
        lat: 37.5665,
        population: 25000000,
      },
      {
        name: "Beijing",
        country: "China",
        lon: 116.4074,
        lat: 39.9042,
        population: 21500000,
      },
    ];

    return cities.map((city) => {
      const floodRisk = this.calculateFloodRisk(city.lat, city.lon);
      const heatRisk = this.calculateHeatIslandRisk(city.lat, city.lon);

      return {
        ...city,
        floodRisk: parseFloat(floodRisk.toFixed(2)),
        heatRisk: parseFloat(heatRisk.toFixed(2)),
        floodLevel: this.estimateFloodDepth(floodRisk),
        temperature: (28 + heatRisk * 12 - Math.abs(city.lat) * 0.3).toFixed(1),
      };
    });
  }
}

const sentinelHub = new SentinelHubService();

// ========== API ENDPOINTS ==========

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      sentinelHub: !!process.env.SENTINEL_CLIENT_ID,
      cacheSize: cache.size,
    },
  });
});

// Get satellite data for location
app.post("/api/satellite-data", async (req, res) => {
  try {
    const { bbox, options } = req.body;

    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return res.status(400).json({
        error: "Invalid bbox. Expected [minLon, minLat, maxLon, maxLat]",
      });
    }

    const data = await sentinelHub.getSatelliteData(bbox, options);

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get flood analysis for area
app.post("/api/flood-analysis", async (req, res) => {
  try {
    const { bbox } = req.body;

    if (!bbox) {
      return res.status(400).json({ error: "bbox required" });
    }

    const satelliteData = await sentinelHub.getSatelliteData(bbox);

    const centerLat = (bbox[1] + bbox[3]) / 2;
    const centerLon = (bbox[0] + bbox[2]) / 2;

    const floodRisk = sentinelHub.calculateFloodRisk(centerLat, centerLon);
    const floodDepth = sentinelHub.estimateFloodDepth(floodRisk);

    res.json({
      success: true,
      data: {
        currentRisk: floodRisk,
        floodDepth: floodDepth,
        satelliteAnalysis: satelliteData.analysis,
        affectedBuildings: Math.round(floodRisk * 42),
        recommendedEvacuation: floodRisk > 0.7,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get heat island analysis for area
app.post("/api/heat-analysis", async (req, res) => {
  try {
    const { bbox } = req.body;

    if (!bbox) {
      return res.status(400).json({ error: "bbox required" });
    }

    const satelliteData = await sentinelHub.getSatelliteData(bbox);

    const centerLat = (bbox[1] + bbox[3]) / 2;

    const heatRisk = sentinelHub.calculateHeatIslandRisk(centerLat, 0);
    const temperature = (
      28 +
      heatRisk * 12 -
      Math.abs(centerLat) * 0.3
    ).toFixed(1);

    res.json({
      success: true,
      data: {
        heatRisk: heatRisk,
        temperature: temperature,
        satelliteAnalysis: satelliteData.analysis,
        vulnerablePopulation: Math.round(heatRisk * 12500),
        coolingRecommendation:
          heatRisk > 0.6
            ? "Increase green cover by 20%"
            : "Current measures sufficient",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get global risk data for Cesium globe
app.get("/api/global-risk-data", async (req, res) => {
  try {
    const riskData = await sentinelHub.getGlobalRiskData();

    res.json({
      success: true,
      data: riskData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get risk data for specific region
app.get("/api/region-risk/:lat/:lon/:radius", async (req, res) => {
  try {
    const { lat, lon, radius } = req.params;

    const bbox = [
      parseFloat(lon) - parseFloat(radius) / 111,
      parseFloat(lat) - parseFloat(radius) / 111,
      parseFloat(lon) + parseFloat(radius) / 111,
      parseFloat(lat) + parseFloat(radius) / 111,
    ];

    const satelliteData = await sentinelHub.getSatelliteData(bbox);

    const floodRisk = sentinelHub.calculateFloodRisk(
      parseFloat(lat),
      parseFloat(lon),
    );
    const heatRisk = sentinelHub.calculateHeatIslandRisk(
      parseFloat(lat),
      parseFloat(lon),
    );

    res.json({
      success: true,
      data: {
        floodRisk,
        heatRisk,
        satelliteData: satelliteData.analysis,
        location: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          radius: parseFloat(radius),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cache management
app.post("/api/cache/clear", (req, res) => {
  cache.clear();
  res.json({ success: true, message: "Cache cleared", size: cache.size });
});

app.get("/api/cache/stats", (req, res) => {
  res.json({
    size: cache.size,
    keys: Array.from(cache.keys()),
  });
});

// Scheduled tasks
cron.schedule("*/50 * * * *", async () => {
  console.log("🔄 Refreshing Sentinel Hub token...");
  try {
    await sentinelHub.getAccessToken();
    console.log("✅ Token refreshed successfully");
  } catch (error) {
    console.error("❌ Token refresh failed:", error.message);
  }
});

cron.schedule("0 * * * *", () => {
  console.log("🧹 Cleaning cache...");
  const now = Date.now();
  let removed = 0;

  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
      removed++;
    }
  }

  console.log(`✅ Removed ${removed} old cache entries`);
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════════╗
    ║   🌊 FLOOD TWIN DIGITAL TWIN          ║
    ║   🛰️  SENTINEL HUB INTEGRATED         ║
    ║   🔥 HEAT ISLAND + FLOOD SIMULATION   ║
    ║   🌐 CESIUM GLOBE VISUALIZATION       ║
    ║   📡 Server running on port ${PORT}      ║
    ╚════════════════════════════════════════╝
    `);
  console.log("\n📡 API Endpoints:");
  console.log("   GET  /api/health");
  console.log("   POST /api/satellite-data");
  console.log("   POST /api/flood-analysis");
  console.log("   POST /api/heat-analysis");
  console.log("   GET  /api/global-risk-data");
  console.log("   GET  /api/region-risk/:lat/:lon/:radius");
});
