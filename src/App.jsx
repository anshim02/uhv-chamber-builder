import React, { createContext, useContext, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ==================================================================
 * DIMENSIONS — all in metres. Nominal catalogue values; adjust these
 * to match your actual parts and the whole model follows.
 * ================================================================== */

// ConFlat standards: flange OD, tube OD, flange thickness, bolt count, bolt-circle Ø, hole Ø
const CF = {
  CF16:  { od: 0.034, tube: 0.019,  t: 0.0075, bolts: 6,  bc: 0.0270, hole: 0.0044 },
  CF40:  { od: 0.070, tube: 0.038,  t: 0.0127, bolts: 6,  bc: 0.0587, hole: 0.0066 },
  CF63:  { od: 0.114, tube: 0.0635, t: 0.0175, bolts: 8,  bc: 0.0921, hole: 0.0084 },
  CF100: { od: 0.152, tube: 0.1016, t: 0.0198, bolts: 16, bc: 0.1303, hole: 0.0084 },
};

const DIM = {
  mainFace: 0.127,           // CF100 4-way cross, centre-to-face
  topReducer: 0.05,          // CF100 -> CF63 conical reducer length
  smallFace: 0.076,          // CF63 (~60 mm) 6-way cross, centre-to-face
  gateValve: 0.08,           // CF100 gate valve, face-to-face
  loadlock: 0.25,            // load-lock tube length
  rightReducer: 0.022,       // CF100 -> CF40 zero-length reducer
  tee: 0.11,                 // CF40 tee (40 mm triple port), face-to-face
  teeSide: 0.065,            // CF16 feedthrough side port, axis-to-face
  bottomFlange: 0.022,       // CF100 multiport flange for evaporators
  evapPortRadius: 0.042,     // CF40 port offset from flange axis
  evapNipples: [0.07, 0.085, 0.06],
  evapLength: 0.17,
  manipTotal: 0.82,          // manipulator flange face to end of tube
  manipStroke: 0.49,
  manipTubeOD: 0.038,
  carriageLen: 0.12,
  carriageRetracted: 0.70,   // carriage centre from flange face at 0 travel
  shaftProtrude: 0.04,       // shaft beyond manipulator flange at 0 travel
  shaftOD: 0.008,
  stageLen: 0.09,            // heating stage incl. ceramic connector
  sampleFromTip: 0.02,       // sample plate centre, measured from the stage tip
};

// Derived positions along the main (x) axis
const X = {
  teeStart: DIM.mainFace + DIM.rightReducer,
  manipFlange: DIM.mainFace + DIM.rightReducer + DIM.tee,
  gateMid: -DIM.mainFace - DIM.gateValve / 2,
  gateEnd: -DIM.mainFace - DIM.gateValve,
  loadlockEnd: -DIM.mainFace - DIM.gateValve - DIM.loadlock,
};
X.teeMid = (X.teeStart + X.manipFlange) / 2;
const SMALL_CROSS_Y = DIM.mainFace + DIM.topReducer + DIM.smallFace;

// Manipulator kinematics: the flange is bolted down, only the shaft + carriage move.
const shaftEndAt = (travel) => X.manipFlange - DIM.shaftProtrude - travel;
const sampleXAt = (travel) => shaftEndAt(travel) - DIM.stageLen + DIM.sampleFromTip;
const TRAVEL_TO_CENTRE = X.manipFlange - DIM.shaftProtrude - DIM.stageLen + DIM.sampleFromTip;

function zoneOf(x) {
  if (x > X.manipFlange) return 'Inside manipulator';
  if (x > X.teeStart) return 'Feedthrough tee';
  if (x > DIM.mainFace) return 'CF100→CF40 reducer';
  if (Math.abs(x) <= 0.01) return 'Cross centre (evaporator focus)';
  if (x >= -DIM.mainFace) return '100 mm cross';
  if (x >= X.gateEnd) return 'Gate valve';
  return 'Load lock';
}

const cm = (m) => (m * 100).toFixed(1);

/* ==================================================================
 * PART CATALOGUE (sidebar text)
 * ================================================================== */
const PARTS = {
  mainCross: {
    name: '100 mm 4-way cross',
    desc: 'Main chamber body. Bottom: evaporators. Top: reducer to 60 mm 6-way cross. Left: gate valve to load lock. Right: manipulator.',
    specs: [`Flanges: 4 × CF100 (6" OD)`, `Centre-to-face: ${cm(DIM.mainFace)} cm`],
  },
  evaporators: {
    name: 'Bottom multiport flange + evaporators',
    desc: 'CF100 flange with three CF40 ports, mounted on the bottom port of the cross. Evaporators point up at the cross centre, so the sample faces down.',
    specs: ['Flange: CF100 → 3 × CF40', `Port offset: ${cm(DIM.evapPortRadius)} cm from axis`],
  },
  topCross: {
    name: 'Reducer + 60 mm 6-way cross',
    desc: 'Conical CF100 → CF63 reducer on the top port, carrying a CF63 (~60 mm bore) 6-way cross.',
    specs: [`Reducer length: ${cm(DIM.topReducer)} cm`, `Small cross centre-to-face: ${cm(DIM.smallFace)} cm`],
  },
  gateValve: {
    name: 'CF100 gate valve',
    desc: 'Left port. Isolates the main chamber from the load lock. Open it before transferring the stage.',
    specs: [`Face-to-face: ${cm(DIM.gateValve)} cm`],
  },
  loadlock: {
    name: 'Load lock',
    desc: 'Load-lock chamber behind the gate valve.',
    specs: [`Length (modelled): ${cm(DIM.loadlock)} cm`],
  },
  feedthroughTee: {
    name: 'CF40 tee with electrical feedthrough',
    desc: 'Zero-length CF100 → CF40 reducer on the right port, then the 40 mm triple port. Its CF16 side port carries the feedthrough for the heater and thermocouple wires.',
    specs: [`Tee face-to-face: ${cm(DIM.tee)} cm`, `Side port: CF16, ${cm(DIM.teeSide)} cm`],
  },
  manipulator: {
    name: 'Linear manipulator',
    desc: 'Magnetically coupled linear shift. The CF40 flange is fixed to the tee and the carriage slides along the outer tube, driving the shaft into the chamber.',
    specs: [`Overall length: ${cm(DIM.manipTotal)} cm`, `Stroke: ${cm(DIM.manipStroke)} cm`, 'Mount: CF40'],
  },
  heatingStage: {
    name: 'Heating stage',
    desc: 'Heating stage taken from the old manipulator and fixed to the shaft tip. Ceramic-beaded wires coil around the shaft back to the tee feedthrough so they can follow the stroke.',
    specs: [`Stage length: ${cm(DIM.stageLen)} cm`, 'Sample faces down (towards evaporators)'],
  },
};

/* ==================================================================
 * SCENE PRIMITIVES
 * ================================================================== */
const SceneCtx = createContext(null);
const PartCtx = createContext(null);
const UP = new THREE.Vector3(0, 1, 0);

const quatFrom = (dir) =>
  new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(...dir).normalize());

// Material that handles selection highlight and the X-ray toggle
function Metal({ color = '#cbd5e1', metalness = 0.9, roughness = 0.2, solid = false }) {
  const part = useContext(PartCtx);
  const { selected, hovered, xray } = useContext(SceneCtx);
  const glow = part === selected ? 0.35 : part === hovered ? 0.15 : 0;
  const see = xray && !solid;
  return (
    <meshStandardMaterial
      key={see ? 'xray' : 'opaque'}
      color={color}
      metalness={metalness}
      roughness={roughness}
      emissive="#3b82f6"
      emissiveIntensity={glow}
      transparent={see}
      opacity={see ? 0.22 : 1}
      depthWrite={!see}
    />
  );
}

// Clickable/hoverable group; everything inside highlights together
function Part({ id, children }) {
  const { setSelected, setHovered } = useContext(SceneCtx);
  return (
    <PartCtx.Provider value={id}>
      <group
        onClick={(e) => { e.stopPropagation(); setSelected(id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(null); document.body.style.cursor = 'auto'; }}
      >
        {children}
      </group>
    </PartCtx.Provider>
  );
}

// Cylinder between two points; optional r2 makes it a cone (reducer)
function Tube({ from, to, r, r2, seg = 48, ...mat }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r2 ?? r, r, a.distanceTo(b), seg]} />
      <Metal {...mat} />
    </mesh>
  );
}

// CF flange: `at` is the sealing face, `dir` its outward normal; the body sits behind the face
function CFFlange({ at, dir, size, t }) {
  const s = CF[size];
  const thick = t ?? s.t;
  return (
    <group position={at} quaternion={quatFrom(dir)}>
      <mesh position={[0, -thick / 2, 0]}>
        <cylinderGeometry args={[s.od / 2, s.od / 2, thick, 48]} />
        <Metal />
      </mesh>
      {Array.from({ length: s.bolts }, (_, i) => {
        const a = (i / s.bolts) * Math.PI * 2;
        return (
          <mesh key={i} position={[(s.bc / 2) * Math.cos(a), -thick / 2, (s.bc / 2) * Math.sin(a)]}>
            <cylinderGeometry args={[s.hole / 2, s.hole / 2, thick + 0.0008, 10]} />
            <Metal color="#334155" metalness={0.4} roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function Label({ position, children, tone = 'default' }) {
  const { labels } = useContext(SceneCtx);
  if (!labels) return null;
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div style={{ ...S.label, ...(tone === 'accent' ? S.labelAccent : null) }}>{children}</div>
    </Html>
  );
}

/* ==================================================================
 * ASSEMBLY
 * ================================================================== */
function MainCross() {
  const f = DIM.mainFace;
  const r = CF.CF100.tube / 2;
  return (
    <Part id="mainCross">
      <Tube from={[-f, 0, 0]} to={[f, 0, 0]} r={r} />
      <Tube from={[0, -f, 0]} to={[0, f, 0]} r={r} />
      <CFFlange at={[f, 0, 0]} dir={[1, 0, 0]} size="CF100" />
      <CFFlange at={[-f, 0, 0]} dir={[-1, 0, 0]} size="CF100" />
      <CFFlange at={[0, f, 0]} dir={[0, 1, 0]} size="CF100" />
      <CFFlange at={[0, -f, 0]} dir={[0, -1, 0]} size="CF100" />
      <Label position={[0, -0.06, 0.08]}>100 mm 4-way cross</Label>
    </Part>
  );
}

function TopCross() {
  const y0 = DIM.mainFace;
  const y1 = y0 + DIM.topReducer;
  const cy = SMALL_CROSS_Y;
  const f = DIM.smallFace;
  const r = CF.CF63.tube / 2;
  const ports = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return (
    <Part id="topCross">
      <Tube from={[0, y0, 0]} to={[0, y1, 0]} r={CF.CF100.tube / 2} r2={r} />
      <CFFlange at={[0, y0, 0]} dir={[0, -1, 0]} size="CF100" />
      <CFFlange at={[0, y1, 0]} dir={[0, 1, 0]} size="CF63" />
      <Tube from={[-f, cy, 0]} to={[f, cy, 0]} r={r} />
      <Tube from={[0, cy - f, 0]} to={[0, cy + f, 0]} r={r} />
      <Tube from={[0, cy, -f]} to={[0, cy, f]} r={r} />
      {ports.map((d, i) => (
        <CFFlange key={i} at={[d[0] * f, cy + d[1] * f, d[2] * f]} dir={d} size="CF63" />
      ))}
      <Label position={[0, cy + f + 0.04, 0]}>Reducer + 60 mm 6-way cross</Label>
    </Part>
  );
}

function Evaporators() {
  const yFace = -DIM.mainFace;
  const yBack = yFace - DIM.bottomFlange;
  return (
    <Part id="evaporators">
      <CFFlange at={[0, yFace, 0]} dir={[0, 1, 0]} size="CF100" t={DIM.bottomFlange} />
      {DIM.evapNipples.map((len, i) => {
        const a = (i / DIM.evapNipples.length) * Math.PI * 2 + Math.PI / 2;
        const px = DIM.evapPortRadius * Math.cos(a);
        const pz = DIM.evapPortRadius * Math.sin(a);
        const yEnd = yBack - len;
        const yBody = yEnd - CF.CF40.t;
        return (
          <group key={i}>
            <Tube from={[px, yBack, pz]} to={[px, yEnd, pz]} r={CF.CF40.tube / 2} />
            <CFFlange at={[px, yEnd, pz]} dir={[0, -1, 0]} size="CF40" />
            <CFFlange at={[px, yEnd, pz]} dir={[0, 1, 0]} size="CF40" />
            <Tube from={[px, yBody, pz]} to={[px, yBody - DIM.evapLength, pz]} r={0.022} color="#64748b" metalness={0.8} roughness={0.3} />
            <Tube from={[px, yBody - DIM.evapLength, pz]} to={[px, yBody - DIM.evapLength - 0.03, pz]} r={0.012} color="#1e293b" metalness={0.5} roughness={0.5} />
          </group>
        );
      })}
      <Label position={[0.13, -0.32, 0]}>Evaporators (3 × CF40)</Label>
    </Part>
  );
}

function GateValve({ open }) {
  const x0 = -DIM.mainFace;
  const x1 = X.gateEnd;
  const body = DIM.gateValve - 2 * CF.CF100.t;
  return (
    <Part id="gateValve">
      <CFFlange at={[x0, 0, 0]} dir={[1, 0, 0]} size="CF100" />
      <CFFlange at={[x1, 0, 0]} dir={[-1, 0, 0]} size="CF100" />
      <mesh position={[X.gateMid, 0.025, 0]}>
        <boxGeometry args={[body, 0.21, 0.17]} />
        <Metal color="#e2e8f0" />
      </mesh>
      {/* Gate plate: across the bore when closed, retracted into the bonnet when open */}
      <mesh position={[X.gateMid, open ? 0.095 : 0, 0]}>
        <boxGeometry args={[0.01, 0.11, 0.11]} />
        <Metal color={open ? '#16a34a' : '#dc2626'} metalness={0.4} roughness={0.4} solid />
      </mesh>
      <Tube from={[X.gateMid, 0.13, 0]} to={[X.gateMid, 0.24, 0]} r={0.022} />
      <Tube from={[X.gateMid, 0.24, 0]} to={[X.gateMid, 0.27, 0]} r={0.034} color={open ? '#16a34a' : '#dc2626'} metalness={0.4} roughness={0.4} />
      <Label position={[X.gateMid, 0.31, 0]}>Gate valve ({open ? 'open' : 'closed'})</Label>
    </Part>
  );
}

function Loadlock() {
  const x0 = X.gateEnd;
  const x1 = X.loadlockEnd;
  return (
    <Part id="loadlock">
      <Tube from={[x0, 0, 0]} to={[x1, 0, 0]} r={CF.CF100.tube / 2} />
      <CFFlange at={[x0, 0, 0]} dir={[1, 0, 0]} size="CF100" />
      <CFFlange at={[x1, 0, 0]} dir={[-1, 0, 0]} size="CF100" />
      <CFFlange at={[x1, 0, 0]} dir={[1, 0, 0]} size="CF100" />
      <Label position={[(x0 + x1) / 2, 0.1, 0]}>Load lock</Label>
    </Part>
  );
}

function FeedthroughTee() {
  const r40 = CF.CF40.tube / 2;
  const r16 = CF.CF16.tube / 2;
  const ys = DIM.teeSide;
  return (
    <Part id="feedthroughTee">
      {/* Zero-length CF100 -> CF40 reducer */}
      <CFFlange at={[DIM.mainFace, 0, 0]} dir={[-1, 0, 0]} size="CF100" t={DIM.rightReducer} />
      {/* CF40 tee */}
      <Tube from={[X.teeStart, 0, 0]} to={[X.manipFlange, 0, 0]} r={r40} />
      <CFFlange at={[X.teeStart, 0, 0]} dir={[-1, 0, 0]} size="CF40" />
      <CFFlange at={[X.manipFlange, 0, 0]} dir={[1, 0, 0]} size="CF40" />
      {/* CF16 side port + electrical feedthrough */}
      <Tube from={[X.teeMid, 0, 0]} to={[X.teeMid, ys, 0]} r={r16} />
      <CFFlange at={[X.teeMid, ys, 0]} dir={[0, 1, 0]} size="CF16" />
      <CFFlange at={[X.teeMid, ys, 0]} dir={[0, -1, 0]} size="CF16" />
      <Tube from={[X.teeMid, ys + CF.CF16.t, 0]} to={[X.teeMid, ys + CF.CF16.t + 0.035, 0]} r={0.011} />
      {[-0.005, 0, 0.005].map((dz, i) => (
        <Tube key={i} from={[X.teeMid + (i - 1) * 0.003, ys + CF.CF16.t + 0.035, dz]} to={[X.teeMid + (i - 1) * 0.003, ys + CF.CF16.t + 0.05, dz]} r={0.0018} color="#f8fafc" metalness={0} roughness={0.8} />
      ))}
      <Label position={[X.teeMid, ys + 0.09, 0]}>CF40 tee + feedthrough</Label>
    </Part>
  );
}

function Manipulator({ travel }) {
  const xf = X.manipFlange;
  const xEnd = xf + DIM.manipTotal;
  const carriageX = xf + DIM.carriageRetracted - travel;
  return (
    <Part id="manipulator">
      <CFFlange at={[xf, 0, 0]} dir={[-1, 0, 0]} size="CF40" />
      <Tube from={[xf + CF.CF40.t, 0, 0]} to={[xEnd, 0, 0]} r={DIM.manipTubeOD / 2} />
      <Tube from={[xEnd - 0.005, 0, 0]} to={[xEnd, 0, 0]} r={DIM.manipTubeOD / 2 + 0.002} color="#94a3b8" />
      {/* Magnetically coupled carriage */}
      <Tube from={[carriageX - DIM.carriageLen / 2, 0, 0]} to={[carriageX + DIM.carriageLen / 2, 0, 0]} r={0.03} color="#e5e7eb" metalness={0.7} roughness={0.25} solid />
      <Tube from={[carriageX, 0, 0.03]} to={[carriageX, 0, 0.038]} r={0.008} color="#475569" solid />
      {/* Shaft: inner magnet (at carriage) to tip */}
      <Tube from={[shaftEndAt(travel), 0, 0]} to={[carriageX, 0, 0]} r={DIM.shaftOD / 2} color="#f8fafc" metalness={1} roughness={0.05} solid />
      <Label position={[xf + DIM.manipTotal / 2, 0.075, 0]}>
        Manipulator — {cm(DIM.manipTotal)} cm, {cm(DIM.manipStroke)} cm stroke
      </Label>
    </Part>
  );
}

function StageWires({ shaftEnd }) {
  const curves = useMemo(() => {
    const x0 = X.teeMid;
    const x1 = shaftEnd - 0.004;
    const R = 0.011;
    const turns = 5;
    return [0, 0.45, 0.9].map((phase) => {
      const pts = [
        new THREE.Vector3(x0, DIM.teeSide - 0.004, 0),
        new THREE.Vector3(x0, R * Math.cos(phase) + 0.01, R * Math.sin(phase)),
      ];
      const N = 160;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = phase + t * turns * Math.PI * 2;
        pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, R * Math.cos(a), R * Math.sin(a)));
      }
      return new THREE.CatmullRomCurve3(pts);
    });
  }, [shaftEnd]);

  return curves.map((c, i) => (
    <mesh key={i}>
      <tubeGeometry args={[c, 320, 0.0013, 6, false]} />
      <Metal color="#f1f5f9" metalness={0} roughness={0.8} solid />
    </mesh>
  ));
}

function HeatingStage({ travel }) {
  const se = shaftEndAt(travel);
  const frameLen = DIM.stageLen - 0.016;
  return (
    <Part id="heatingStage">
      <group position={[se, 0, 0]}>
        {/* Ceramic wire connector */}
        <mesh position={[-0.008, 0, 0]}>
          <boxGeometry args={[0.016, 0.014, 0.022]} />
          <Metal color="#f5f5f4" metalness={0} roughness={0.7} solid />
        </mesh>
        {/* Stage frame */}
        <mesh position={[-0.016 - frameLen / 2, 0, 0]}>
          <boxGeometry args={[frameLen, 0.01, 0.03]} />
          <Metal color="#9ca3af" solid />
        </mesh>
        {/* Sample plate, facing down at the evaporators */}
        <mesh position={[-DIM.stageLen + DIM.sampleFromTip, -0.0065, 0]}>
          <boxGeometry args={[0.02, 0.003, 0.02]} />
          <Metal color="#d4a017" metalness={0.8} roughness={0.25} solid />
        </mesh>
      </group>
      <StageWires shaftEnd={se} />
      <Label position={[sampleXAt(travel), -0.045, 0.03]} tone="accent">Heating stage</Label>
    </Part>
  );
}

/* ==================================================================
 * APP
 * ================================================================== */
export default function UHVBuilder() {
  const [travel, setTravel] = useState(0); // metres, 0 = fully retracted
  const [selected, setSelected] = useState('mainCross');
  const [hovered, setHovered] = useState(null);
  const [gateOpen, setGateOpen] = useState(true);
  const [xray, setXray] = useState(true);
  const [labels, setLabels] = useState(true);

  const sampleX = sampleXAt(travel);
  const stageFront = shaftEndAt(travel) - DIM.stageLen;
  const collision = !gateOpen && stageFront < X.gateMid;
  const info = PARTS[selected];

  const ctx = { selected, hovered, xray, labels, setSelected, setHovered };

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div>
          <h2 style={S.title}>UHV Chamber Configurator</h2>
          <p style={S.subtitle}>
            100 mm 4-way cross · Top: reducer → 60 mm 6-way cross · Bottom: evaporators · Left: gate valve → load lock · Right: {cm(DIM.manipTotal)} cm manipulator ({cm(DIM.manipStroke)} cm stroke)
          </p>
        </div>
        <div style={S.controls}>
          <Toggle on={gateOpen} onClick={() => setGateOpen(!gateOpen)}>Gate {gateOpen ? 'open' : 'closed'}</Toggle>
          <Toggle on={xray} onClick={() => setXray(!xray)}>X-ray</Toggle>
          <Toggle on={labels} onClick={() => setLabels(!labels)}>Labels</Toggle>
        </div>
      </header>

      <div style={S.body}>
        <aside style={S.sidebar}>
          <h3 style={S.h3}>Stroke</h3>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={S.muted}>Travel</span>
              <span style={S.big}>{cm(travel)} cm</span>
            </div>
            <input
              type="range" min={0} max={DIM.manipStroke * 100} step={0.5}
              value={travel * 100}
              onChange={(e) => setTravel(parseFloat(e.target.value) / 100)}
              style={{ width: '100%', accentColor: '#2563eb', margin: '8px 0' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.btn} onClick={() => setTravel(0)}>Retract</button>
              <button style={S.btn} onClick={() => setTravel(TRAVEL_TO_CENTRE)}>To centre</button>
              <button style={S.btn} onClick={() => setTravel(DIM.manipStroke)}>Full</button>
            </div>
          </div>

          <div style={{ ...S.card, marginTop: 10, borderColor: collision ? '#fca5a5' : '#e2e8f0', background: collision ? '#fef2f2' : '#f8fafc' }}>
            <Row k="Sample vs. cross centre" v={`${sampleX >= 0 ? '+' : ''}${cm(sampleX)} cm`} />
            <Row k="Zone" v={zoneOf(sampleX)} />
            <Row k="Travel to centre" v={`${cm(TRAVEL_TO_CENTRE)} cm`} />
            {collision && (
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
                Stage hits the closed gate valve. Open the valve first.
              </p>
            )}
          </div>

          <h3 style={{ ...S.h3, marginTop: 20 }}>Components</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(PARTS).map(([id, p]) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                style={{ ...S.listItem, ...(id === selected ? S.listItemActive : null) }}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div style={{ ...S.card, marginTop: 12 }}>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{info.name}</p>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{info.desc}</p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
              {info.specs.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <p style={{ ...S.muted, marginTop: 12, lineHeight: 1.5 }}>
            Dimensions are nominal catalogue values. Edit <code>DIM</code> at the top of App.jsx to match your parts.
          </p>
        </aside>

        <main style={{ flex: 1, position: 'relative' }}>
          <Canvas camera={{ position: [0.35, 0.45, 1.35], fov: 40, near: 0.01, far: 20 }} onPointerMissed={() => setHovered(null)}>
            <color attach="background" args={['#f8fafc']} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[6, 10, 6]} intensity={1.6} />
            <directionalLight position={[-6, -4, -6]} intensity={0.5} />
            <Environment preset="city" />
            <OrbitControls makeDefault target={[0.25, 0, 0]} minDistance={0.2} maxDistance={4} />

            <SceneCtx.Provider value={ctx}>
              <MainCross />
              <TopCross />
              <Evaporators />
              <GateValve open={gateOpen} />
              <Loadlock />
              <FeedthroughTee />
              <Manipulator travel={travel} />
              <HeatingStage travel={travel} />
            </SceneCtx.Provider>

            <gridHelper args={[3, 30, '#cbd5e1', '#e2e8f0']} position={[0.25, -0.46, 0]} />
          </Canvas>
        </main>
      </div>
    </div>
  );
}

function Toggle({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{ ...S.btn, ...(on ? S.btnOn : null), padding: '7px 12px' }}>
      {children}
    </button>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

/* ==================================================================
 * STYLES
 * ================================================================== */
const S = {
  app: { width: '100vw', height: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { minHeight: 70, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 24px', zIndex: 10 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '2px 0 0', fontSize: 12, color: '#64748b' },
  controls: { display: 'flex', gap: 8, flexShrink: 0 },
  body: { flex: 1, display: 'flex', minHeight: 0 },
  sidebar: { width: 300, background: '#fff', borderRight: '1px solid #e2e8f0', padding: 20, overflowY: 'auto', zIndex: 5 },
  h3: { fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' },
  card: { background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' },
  muted: { fontSize: 12, color: '#64748b' },
  big: { fontSize: 20, fontWeight: 700, color: '#2563eb', fontVariantNumeric: 'tabular-nums' },
  btn: { flex: 1, fontSize: 12, fontWeight: 600, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' },
  btnOn: { background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' },
  listItem: { textAlign: 'left', fontSize: 13, padding: '7px 10px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', color: '#334155', cursor: 'pointer' },
  listItemActive: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 600 },
  label: { background: '#fff', padding: '3px 8px', borderRadius: 6, boxShadow: '0 2px 4px rgb(0 0 0 / 0.08)', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' },
  labelAccent: { background: '#fffbeb', borderColor: '#f59e0b', color: '#92400e' },
};
