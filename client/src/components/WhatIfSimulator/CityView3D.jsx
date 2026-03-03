import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Plane, Stars } from "@react-three/drei";
import * as THREE from "three";

const CityView3D = ({
  floodLevel,
  heatIntensity,
  activeSimulation,
  greenCover,
  buildingDensity,
}) => {
  // Calculate colors based on simulations
  const getBuildingColor = (height, x, z) => {
    // Base color
    let color = "#e0e5ec";

    if (activeSimulation === "flood" || activeSimulation === "combined") {
      // Flood coloring - blue tint based on flood level
      const floodDepth = (floodLevel / 100) * 4; // Max 4m flood
      if (height < floodDepth) {
        color = "#ff5252"; // Submerged - red
      } else if (height < floodDepth * 2) {
        color = "#ffeb3b"; // At risk - yellow
      }
    }

    if (activeSimulation === "heat" || activeSimulation === "combined") {
      // Heat island coloring - red tint based on heat intensity and position
      const heatFactor = heatIntensity / 100;
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const heatExposure =
        Math.max(0, 1 - distanceFromCenter / 20) * heatFactor;

      if (heatExposure > 0.7) {
        color = "#ff5252"; // Severe heat
      } else if (heatExposure > 0.3) {
        color = "#ffaa33"; // Moderate heat
      }
    }

    return color;
  };

  // Generate buildings
  const buildings = useMemo(() => {
    const positions = [];
    const gridSize = 7;
    const spacing = 4;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (Math.random() > buildingDensity / 100) continue;

        const x = i * spacing;
        const z = j * spacing;
        const height = 1.5 + Math.random() * 4;

        positions.push({ x, z, height });
      }
    }
    return positions;
  }, [buildingDensity]);

  // Generate trees (green cover)
  const trees = useMemo(() => {
    const positions = [];
    const treeCount = Math.floor(greenCover * 3);

    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push({ x, z });
    }
    return positions;
  }, [greenCover]);

  return (
    <div className="city-view-3d">
      <Canvas
        camera={{ position: [25, 15, 25], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <Sky sunPosition={[10, 20, 10]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Ground */}
        <Plane
          args={[60, 60]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.5, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color={activeSimulation === "heat" ? "#8B4513" : "#2a5a3a"}
            roughness={0.8}
          />
        </Plane>

        {/* Water (flood) */}
        {activeSimulation !== "heat" && floodLevel > 0 && (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.4 + (floodLevel / 100) * 3, 0]}
          >
            <circleGeometry args={[25, 64]} />
            <meshStandardMaterial
              color="#2277aa"
              transparent
              opacity={0.4 + (floodLevel / 100) * 0.3}
              emissive={new THREE.Color(0x113355)}
            />
          </mesh>
        )}

        {/* Buildings */}
        {buildings.map((b, idx) => (
          <mesh
            key={idx}
            position={[b.x, b.height / 2, b.z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1.2, b.height, 1.2]} />
            <meshStandardMaterial
              color={getBuildingColor(b.height, b.x, b.z)}
              emissive={
                activeSimulation === "heat" && heatIntensity > 50
                  ? new THREE.Color(0x331100)
                  : new THREE.Color(0x000000)
              }
            />
          </mesh>
        ))}

        {/* Trees */}
        {trees.map((t, idx) => (
          <group key={idx} position={[t.x, 0, t.z]}>
            <mesh position={[0, 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, 1.6]} />
              <meshStandardMaterial color="#8B5A2B" />
            </mesh>
            <mesh position={[0, 1.8, 0]} castShadow>
              <coneGeometry args={[0.8, 1.2, 8]} />
              <meshStandardMaterial color="#2E7D32" />
            </mesh>
          </group>
        ))}

        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minDistance={15}
          maxDistance={50}
          enableDamping
        />
        <Stars radius={100} depth={50} count={1000} factor={4} />
      </Canvas>
    </div>
  );
};

export default CityView3D;
