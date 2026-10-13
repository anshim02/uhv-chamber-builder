import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

export default function UHVBuilder() {
  const [manipulatorPos, setManipulatorPos] = useState(0.43); // 43cm stroke travel slider

  return (
    <div className="w-screen h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header & Travel Control */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-10">
        <div>
          <h1 className="text-xl font-bold">UHV Chamber: Configuration 1</h1>
          <p className="text-xs text-slate-400">Main Body: 56.5 cm | Diameter: 14 cm | Manipulator Stroke: {Math.round(manipulatorPos * 100)} cm</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">Manipulator Extension:</label>
          <input 
            type="range" 
            min="0" 
            max="0.43" 
            step="0.01" 
            value={manipulatorPos} 
            onChange={(e) => setManipulatorPos(parseFloat(e.target.value))}
            className="w-48 accent-cyan-500 cursor-pointer"
          />
          <span className="text-cyan-400 font-mono w-16">{(manipulatorPos * 100).toFixed(1)} cm</span>
        </div>
      </div>

      {/* 3D Viewport Canvas */}
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0.2, 0.4, 0.8], fov: 50 }}>
          <color attach="background" args={['#090d16']} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />

          <OrbitControls makeDefault />

          {/* ==========================================
              CONFIGURATION 1 3D MODEL ASSEMBLY
             ========================================== */}
          <group position={[0, 0, 0]}>
            
            {/** 1. Main Horizontal Cross Cylinder (56.5 cm length, 14 cm diameter) */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.565, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>

            {/** 2. Vertical Cross Branch (Viewport / Pyrometer on top, Evaporator on bottom) */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.28, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>

            {/** 3. Turbo Molecular Pump Port (Downward angled/vertical offset branch) */}
            <group position={[-0.15, -0.12, 0]} rotation={[0, 0, -Math.PI / 6]}>
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.15, 32]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Turbo Pump Body */}
              <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.08, 0.06, 0.12, 32]} />
                <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
              </mesh>
            </group>

            {/** 4. Loadlock Connection Flange (Left Side) */}
            <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 32]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
            </mesh>

            {/** 5. Manipulator Assembly (Right Side with dynamic stroke translation) */}
            <group position={[0.28 + (0.43 - manipulatorPos), 0, 0]}>
              {/* Manipulator Flange & Shaft Housing */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.03, 32]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Traveling Rod / Sample Stage reaching into the chamber */}
              <mesh position={[-manipulatorPos / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.015, 0.015, manipulatorPos, 16]} />
                <meshStandardMaterial color="#f8fafc" metalness={1.0} roughness={0.1} />
              </mesh>
              {/* Sample Stage Tip */}
              <mesh position={[-manipulatorPos, 0, 0]}>
                <boxGeometry args={[0.02, 0.04, 0.04]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.5} />
              </mesh>
            </group>

          </group>

          {/* Reference Floor Grid */}
          <gridHelper args={[2, 20, '#334155', '#1e293b']} position={[0, -0.3, 0]} />
        </Canvas>
      </div>
    </div>
  );
}
