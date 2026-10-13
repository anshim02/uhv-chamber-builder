import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';

// Helper for ConFlat Flanges
function CFFlange({ position = [0, 0, 0], rotation = [0, 0, 0], radius = 0.085, thickness = 0.018 }) {
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
  const [manipulatorPos, setManipulatorPos] = useState(0.43);
  const [selectedPart, setSelectedPart] = useState('Main Chamber Body');

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Navigation / Title Bar */}
      <div style={{
        height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>UHV Chamber 3D Builder</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Configuration 1: Applied Physics Lab Setup</p>
        </div>

        {/* Live Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Manipulator Stroke:</span>
            <input 
              type="range" min="0" max="0.43" step="0.005" 
              value={manipulatorPos} 
              onChange={(e) => setManipulatorPos(parseFloat(e.target.value))}
              style={{ width: '150px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', width: '50px' }}>
              {(manipulatorPos * 100).toFixed(1)} cm
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        
        {/* Left Properties Sidebar */}
        <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', zIndex: 5, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Inspection & Info
          </h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SELECTED COMPONENT:</p>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{selectedPart}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
            <p style={{ margin: '0', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              {selectedPart === 'Main Chamber Body' && 'Main 6-way cross chamber body. Length: 56.5 cm, Inner Diameter: 14 cm, constructed from high-grade stainless steel.'}
              {selectedPart === 'Linear Manipulator' && 'High-precision UHV linear transfer manipulator with 43 cm maximum stroke length for sample insertion.'}
              {selectedPart === 'Evaporator / Deposition' && 'Scienta Omicron EFM evaporator cluster mounted on bottom port for metal film growth.'}
              {selectedPart === 'Turbo Molecular Pump' && 'High-vacuum pumping station port with gate valve and isolation fittings.'}
              {selectedPart === 'Viewport & Pyrometer' && 'Top CF flange fitted with optical quartz window for surface viewing and pyrometry.'}
            </p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Chamber Parameters</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              <li>Base Pressure: &lt; 1×10⁻¹⁰ mbar</li>
              <li>Bakeout Temp: Up to 150°C</li>
              <li>Sample Holder: Standard Omicron plate</li>
            </ul>
          </div>
        </div>

        {/* 3D Viewport Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas camera={{ position: [0.5, 0.4, 0.6], fov: 42 }}>
            <color attach="background" args={['#f8fafc']} />
            
            {/* Soft Studio Lighting */}
            <ambientLight intensity={0.9} />
            <directionalLight position={[6, 10, 6]} intensity={1.8} />
            <directionalLight position={[-6, -4, -6]} intensity={0.6} />
            <Environment preset="city" />

            <OrbitControls makeDefault minDistance={0.3} maxDistance={2.0} />

            {/* =========================================================
                3D MODEL ASSEMBLY WITH INTERACTIVE HTML LABELS
               ========================================================= */}
            <group position={[0, 0, 0]}>

              {/* 1. Main Chamber Body */}
              <group onClick={() => setSelectedPart('Main Chamber Body')} style={{ cursor: 'pointer' }}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.07, 0.07, 0.565, 64]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>
                <CFFlange position={[-0.2825, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.095} />
                <CFFlange position={[0.2825, 0, 0]} rotation={[0, 0, -Math.PI / 2]} radius={0.095} />
                
                <Html position={[0, 0.12, 0]} center>
                  <div onClick={() => setSelectedPart('Main Chamber Body')} style={{
                    background: '#ffffff', padding: '4px 10px', borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1',
                    fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', cursor: 'pointer'
                  }}>
                    Main Chamber (56.5 cm)
                  </div>
                </Html>
              </group>

              {/* 2. Top Viewport */}
              <group position={[0.08, 0, 0]} onClick={() => setSelectedPart('Viewport & Pyrometer')}>
                <mesh>
                  <cylinderGeometry args={[0.07, 0.07, 0.32, 64]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                </mesh>
                <CFFlange position={[0.08, 0.16, 0]} radius={0.095} />
                <mesh position={[0.08, 0.165, 0]}>
                  <cylinderGeometry args={[0.065, 0.065, 0.004, 32]} />
                  <meshPhysicalMaterial color="#38bdf8" transmission={0.9} opacity={1} transparent roughness={0.05} ior={1.5} />
                </mesh>

                <Html position={[0.08, 0.22, 0]} center>
                  <div style={{
                    background: '#ffffff', padding: '4px 10px', borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1',
                    fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', cursor: 'pointer'
                  }}>
                    Viewport / Pyrometer
                  </div>
                </Html>
              </group>

              {/* 3. Evaporator (Bottom) */}
              <group position={[0.08, -0.22, 0]} onClick={() => setSelectedPart('Evaporator / Deposition')}>
                <mesh>
                  <cylinderGeometry args={[0.065, 0.08, 0.12, 32]} />
                  <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
                </mesh>
                <Html position={[0, -0.1, 0]} center>
                  <div style={{
                    background: '#ffffff', padding: '4px 10px', borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1',
                    fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', cursor: 'pointer'
                  }}>
                    Evaporator
                  </div>
                </Html>
              </group>

              {/* 4. Turbo Pump Port (Left) */}
              <group position={[-0.2, -0.15, 0]} onClick={() => setSelectedPart('Turbo Molecular Pump')}>
                <mesh>
                  <cylinderGeometry args={[0.07, 0.05, 0.16, 32]} />
                  <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
                </mesh>
                <Html position={[0, -0.12, 0]} center>
                  <div style={{
                    background: '#ffffff', padding: '4px 10px', borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1',
                    fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', cursor: 'pointer'
                  }}>
                    Turbo Pump Port
                  </div>
                </Html>
              </group>

              {/* 5. Linear Manipulator (Right with dynamic stroke) */}
              <group position={[0.29 + (0.43 - manipulatorPos), 0, 0]} onClick={() => setSelectedPart('Linear Manipulator')}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.1, 32]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
                </mesh>
                {/* Moving Rod */}
                <mesh position={[-manipulatorPos / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.012, 0.012, manipulatorPos, 32]} />
                  <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.05} />
                </mesh>
                {/* Sample Stage Tip */}
                <mesh position={[-manipulatorPos, 0, 0]}>
                  <boxGeometry args={[0.03, 0.025, 0.025]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
                </mesh>

                <Html position={[0, 0.1, 0]} center>
                  <div style={{
                    background: '#ffffff', padding: '4px 10px', borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #cbd5e1',
                    fontSize: '11px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', cursor: 'pointer'
                  }}>
                    Linear Manipulator (43 cm)
                  </div>
                </Html>
              </group>

            </group>

            {/* Clean Studio Floor Shadow Grid */}
            <gridHelper args={[3, 30, '#cbd5e1', '#e2e8f0']} position={[0, -0.35, 0]} />
          </Canvas>
        </div>

      </div>
    </div>
  );
}
