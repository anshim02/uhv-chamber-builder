import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';

// Helper component to render ConFlat (CF) Flanges on port ends
function CFFlange({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.085, thickness = 0.018 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Outer Flange Ring */}
      <mesh>
        <cylinderGeometry args={[radius, radius, thickness, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Inner Raised Knife-edge Rim */}
      <mesh position={[0, thickness / 2 + 0.001, 0]}>
        <cylinderGeometry args={[radius * 0.75, radius * 0.75, 0.003, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
}

export default function UHVBuilder() {
  const [manipulatorPos, setManipulatorPos] = useState(0.43); // 43cm max travel

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16', fontFamily: 'sans-serif' }}>
      
      {/* Top Floating Control Bar */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid #334155', borderRadius: '12px', padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>UHV Chamber: Configuration 1</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Main Body: 56.5 cm L × 14 cm D | Total w/ Gate Valve: 63.5 cm | Stroke: 43 cm
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Manipulator Position:</label>
          <input 
            type="range" min="0" max="0.43" step="0.005" 
            value={manipulatorPos} 
            onChange={(e) => setManipulatorPos(parseFloat(e.target.value))}
            style={{ width: '200px', cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 'bold', width: '60px' }}>
            {(manipulatorPos * 100).toFixed(1)} cm
          </span>
        </div>
      </div>

      {/* 3D Viewport - Takes Full Screen */}
      <div style={{ flex: 1, width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0.6, 0.35, 0.7], fov: 45 }}>
          <color attach="background" args={['#090d16']} />
          
          {/* Studio Lighting & Realistic Metal Reflections */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={2.0} />
          <directionalLight position={[-5, -2, -5]} intensity={1.0} color="#38bdf8" />
          <pointLight position={[0, 2, 0]} intensity={1.5} />
          <Environment preset="city" />

          <OrbitControls makeDefault minDistance={0.3} maxDistance={2.5} />

          {/* =========================================================
              MAIN CHAMBER ASSEMBLY (1 unit = 1 meter scale)
             ========================================================= */}
          <group position={[0, 0, 0]}>

            {/* 1. Main Horizontal Tube (56.5 cm Length, 14 cm Outer Diameter) */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.565, 64]} />
              <meshStandardMaterial color="#d1d5db" metalness={0.92} roughness={0.18} />
            </mesh>

            {/* Main Chamber End Flanges */}
            <CFFlange position={[-0.2825, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.1} />
            <CFFlange position={[0.2825, 0, 0]} rotation={[0, 0, -Math.PI / 2]} radius={0.1} />

            {/* 2. Vertical Cross Branch (Viewport Top, Evaporator Bottom) */}
            <mesh position={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.32, 64]} />
              <meshStandardMaterial color="#d1d5db" metalness={0.92} roughness={0.18} />
            </mesh>

            {/* Top Viewport Flange & Glass Window */}
            <CFFlange position={[0.08, 0.16, 0]} rotation={[0, 0, 0]} radius={0.1} />
            <mesh position={[0.08, 0.165, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.005, 32]} />
              <meshPhysicalMaterial color="#7dd3fc" transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.5} />
            </mesh>

            {/* Bottom Evaporator Connection Flange */}
            <CFFlange position={[0.08, -0.16, 0]} rotation={[Math.PI, 0, 0]} radius={0.1} />
            
            {/* Evaporator Cluster Body (Bottom) */}
            <group position={[0.08, -0.23, 0]}>
              <mesh>
                <cylinderGeometry args={[0.065, 0.08, 0.12, 32]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
              </mesh>
            </group>

            {/* 3. Turbo Pump / Gauge Side Cross (Left Side Assembly) */}
            <group position={[-0.2, 0, 0]}>
              {/* Vertical Branch for Turbo / Pressure Gauge */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.22, 32]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              <CFFlange position={[0, 0.11, 0]} radius={0.065} />
              <CFFlange position={[0, -0.11, 0]} rotation={[Math.PI, 0, 0]} radius={0.065} />

              {/* Turbo Pump Unit attached at bottom */}
              <group position={[0, -0.2, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.075, 0.06, 0.16, 32]} />
                  <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Cooling Fins / Ribs */}
                <mesh position={[0, -0.02, 0]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.08, 32]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
              </group>
            </group>

            {/* 4. Gate Valve (Estimated 7 cm width between Main Cross & Loadlock) */}
            <group position={[-0.32, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.16, 0.07, 0.16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Actuator Valve Knob / Cylinder on Top */}
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.12, 16]} />
                <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
              </mesh>
            </group>

            {/* 5. Linear Manipulator Assembly (Right Side) */}
            {/* Base Housing on Main Flange */}
            <group position={[0.29 + (0.43 - manipulatorPos), 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.06, 0.1, 32]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
              </mesh>

              {/* Stainless Steel Drive Shaft entering into the chamber */}
              <mesh position={[-manipulatorPos / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.012, manipulatorPos, 32]} />
                <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
              </mesh>

              {/* Sample Stage / Transfer Head at the tip */}
              <mesh position={[-manipulatorPos, 0, 0]}>
                <boxGeometry args={[0.03, 0.025, 0.025]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>

          </group>

          {/* Reference Floor Grid */}
          <gridHelper args={[3, 30, '#475569', '#1e293b']} position={[0, -0.35, 0]} />
        </Canvas>
      </div>

    </div>
  );
}
