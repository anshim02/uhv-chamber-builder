import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';

// Helper for ConFlat (CF) Flanges
function CFFlange({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.075, thickness = 0.015 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[radius, radius, thickness, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>
    </group>
  );
}

export default function UHVBuilder() {
  const [manipulatorPos, setManipulatorPos] = useState(0.49); // 49 cm stroke travel
  const [selectedPart, setSelectedPart] = useState('Main 100mm 6-Way Cross');

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Header & Interactive Controls */}
      <div style={{
        height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>UHV Chamber Custom Configurator</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Main: 100mm 6-Way Cross | Top: Reducer to 60mm 6-Way Cross | Stroke: 49 cm (82 cm Shaft)</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Manipulator Stroke (49 cm):</span>
            <input 
              type="range" min="0" max="0.49" step="0.005" 
              value={manipulatorPos} 
              onChange={(e) => setManipulatorPos(parseFloat(e.target.value))}
              style={{ width: '160px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', width: '55px' }}>
              {(manipulatorPos * 100).toFixed(1)} cm
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        
        {/* Left Properties Sidebar */}
        <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', zIndex: 5, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Component Info
          </h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SELECTED COMPONENT:</p>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{selectedPart}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
            <p style={{ margin: '0', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              {selectedPart === 'Main 100mm 6-Way Cross' && 'Central 100 mm nominal 6-way cross chamber body hosting the primary UHV interaction volume.'}
              {selectedPart === 'Bottom Evaporators' && 'Evaporator cluster mounted directly onto the bottom flange port of the 100mm cross.'}
              {selectedPart === 'Top Reducer & 60mm 6-Way Cross' && 'Top reducer flange mating into a secondary 60 mm port 6-way cross body chamber for auxiliary instrumentation.'}
              {selectedPart === 'Gate Valve & Loadlock' && 'Left-side gate valve assembly connecting the main chamber system to the loadlock.'}
              {selectedPart === 'Linear Manipulator & Heating Stage' && '82 cm total shaft length linear manipulator with 49 cm travel stroke. Outfitted with the heating stage feedthrough mount.'}
            </p>
          </div>
        </div>

        {/* 3D Viewport Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas camera={{ position: [0.6, 0.4, 0.8], fov: 42 }}>
            <color attach="background" args={['#f8fafc']} />
            
            <ambientLight intensity={0.9} />
            <directionalLight position={[6, 10, 6]} intensity={1.8} />
            <directionalLight position={[-6, -4, -6]} intensity={0.6} />
            <Environment preset="city" />

            <OrbitControls makeDefault minDistance={0.3} maxDistance={2.5} />

            <group position={[0, 0, 0]}>

              {/* =========================================================
                  1. CENTRAL MAIN 100mm 6-WAY CROSS BODY
                 ========================================================= */}
              <group onClick={() => setSelectedPart('Main 100mm 6-Way Cross')} style={{ cursor: 'pointer' }}>
                {/* Horizontal Axis Tube */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.055, 0.055, 0.4, 48]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Perpendicular Center Axis Tube (front-to-back optical/service path) */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.055, 0.055, 0.4, 48]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>

                <Html position={[0, 0.12, 0]} center>
                  <div style={{ background: '#fff', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                    Main 100mm 6-Way Cross
                  </div>
                </Html>
              </group>

              {/* =========================================================
                  2. BOTTOM PORT & EVAPORATORS
                 ========================================================= */}
              <group position={[0, -0.22, 0]} onClick={() => setSelectedPart('Bottom Evaporators')}>
                <mesh>
                  <cylinderGeometry args={[0.05, 0.055, 0.14, 32]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>
                <CFFlange position={[0, -0.07, 0]} rotation={[Math.PI, 0, 0]} radius={0.08} />
                {/* Evaporator Cluster Unit */}
                <mesh position={[0, -0.14, 0]}>
                  <cylinderGeometry args={[0.06, 0.07, 0.1, 32]} />
                  <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
                </mesh>

                <Html position={[0, -0.1, 0]} center>
                  <div style={{ background: '#fff', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                    Bottom Evaporators
                  </div>
                </Html>
              </group>

              {/* =========================================================
                  3. TOP REDUCER & 60mm 6-WAY CROSS BODY CHAMBER
                 ========================================================= */}
              <group position={[0, 0.22, 0]} onClick={() => setSelectedPart('Top Reducer & 60mm 6-Way Cross')}>
                {/* Reducer Flange Transition */}
                <mesh position={[0, -0.04, 0]}>
                  <cylinderGeometry args={[0.035, 0.055, 0.08, 32]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>
                
                {/* Secondary 60mm 6-Way Cross Body Chamber */}
                <group position={[0, 0.1, 0]}>
                  <mesh>
                    <cylinderGeometry args={[0.035, 0.035, 0.22, 32]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.22, 32]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                  </mesh>
                  <CFFlange position={[0, 0.11, 0]} radius={0.06} />
                </group>

                <Html position={[0, 0.18, 0]} center>
                  <div style={{ background: '#fff', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                    Top 60mm 6-Way Cross
                  </div>
                </Html>
              </group>

              {/* =========================================================
                  4. LEFT GATE VALVE & LOADLOCK CONNECTION
                 ========================================================= */}
              <group position={[-0.3, 0, 0]} onClick={() => setSelectedPart('Gate Valve & Loadlock')}>
                <CFFlange position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.075} />
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <boxGeometry args={[0.12, 0.06, 0.12]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.08, 16]} />
                  <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
                </mesh>

                <Html position={[0, 0.16, 0]} center>
                  <div style={{ background: '#fff', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                    Gate Valve / Loadlock
                  </div>
                </Html>
              </group>

              {/* =========================================================
                  5. RIGHT LINEAR MANIPULATOR (82 cm Shaft, 49 cm Stroke)
                 ========================================================= */}
              <group position={[0.22 + (0.49 - manipulatorPos), 0, 0]} onClick={() => setSelectedPart('Linear Manipulator & Heating Stage')}>
                <CFFlange position={[0.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]} radius={0.075} />
                {/* Manipulator Body Housing */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.055, 0.055, 0.1, 32]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
                </mesh>
                {/* 49 cm Dynamic Travelling Rod */}
                <mesh position={[-manipulatorPos / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.012, 0.012, manipulatorPos, 32]} />
                  <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
                </mesh>
                {/* Heating Stage Sample Holder Assembly at tip */}
                <group position={[-manipulatorPos, 0, 0]}>
                  <boxGeometry args={[0.035, 0.045, 0.045]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
                </group>

                <Html position={[0, 0.12, 0]} center>
                  <div style={{ background: '#fff', padding: '4px 10px', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                    Manipulator (49 cm Stroke)
                  </div>
                </Html>
              </group>

            </group>

            <gridHelper args={[3, 30, '#cbd5e1', '#e2e8f0']} position={[0, -0.38, 0]} />
          </Canvas>
        </div>

      </div>
    </div>
  );
}
