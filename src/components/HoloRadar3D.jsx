import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/*
  3D HOLOGRAPHIC RADAR — MULTI-TIER PLATFORM DESIGN
  A thick, layered disk with visible depth:
  - 3 stacked tiers (stepped pedestal)
  - Glowing edges on each tier
  - Concentric rings on top surface
  - Radial grid lines
  - Rotating scan beam
  - Energy core
  No globe.
*/
export default function HoloRadar3D({ sweepAngleRef }) {
  const sweepRef = useRef()
  const sweepAngle = useRef(0)
  const coreRef = useRef()
  const coreGlowRef = useRef()
  const pulseRingRefs = useRef([])
  const tierGlowRefs = useRef([])

  if (sweepAngleRef) sweepAngleRef.current = { getSweepAngle: () => sweepAngle.current }

  // ── 3 TIERS of the platform ──
  const tiers = useMemo(() => [
    { radius: 3.8, height: 0.06, y: -0.15, color: '#060d18', rimColor: '#005577', rimOpacity: 0.12 },
    { radius: 3.2, height: 0.08, y: -0.06, color: '#071220', rimColor: '#0088aa', rimOpacity: 0.18 },
    { radius: 2.4, height: 0.06, y: 0.01,  color: '#081828', rimColor: '#00bbdd', rimOpacity: 0.22 },
  ], [])

  // ── Concentric rings on top surface ──
  const surfaceRings = useMemo(() => {
    const rings = []
    const radii = [0.4, 0.8, 1.2, 1.6, 2.0, 2.5, 3.0, 3.5]
    radii.forEach(r => {
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(r * Math.cos(a), 0.05, r * Math.sin(a)))
      }
      rings.push({ geo: new THREE.BufferGeometry().setFromPoints(pts), opacity: 0.15 * (1 - r / 4.5) })
    })
    return rings
  }, [])

  // ── Tick marks around outer rim ──
  const tickMarks = useMemo(() => {
    const ticks = []
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2
      const isMajor = i % 6 === 0
      const inner = isMajor ? 3.4 : 3.55
      ticks.push(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * inner, 0.05, Math.sin(a) * inner),
        new THREE.Vector3(Math.cos(a) * 3.75, 0.05, Math.sin(a) * 3.75),
      ]))
    }
    return ticks
  }, [])

  // ── Radial grid lines ──
  const radialLines = useMemo(() => {
    const lines = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      lines.push(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.05, 0),
        new THREE.Vector3(Math.cos(a) * 3.5, 0.05, Math.sin(a) * 3.5),
      ]))
    }
    return lines
  }, [])

  // ── Scan beam ──
  const beamGeo = useMemo(() => {
    const s = new THREE.Shape(), arc = Math.PI / 8, outer = 3.7
    s.moveTo(0, 0)
    for (let i = 0; i <= 20; i++) { const a = -arc / 2 + (arc * i) / 20; s.lineTo(Math.cos(a) * outer, Math.sin(a) * outer) }
    s.lineTo(0, 0)
    return new THREE.ShapeGeometry(s)
  }, [])

  const trailGeo = useMemo(() => {
    const s = new THREE.Shape(), arc = Math.PI / 3, outer = 3.5
    s.moveTo(0, 0)
    for (let i = 0; i <= 24; i++) { const a = -arc + (arc * i) / 24; s.lineTo(Math.cos(a) * outer, Math.sin(a) * outer) }
    s.lineTo(0, 0)
    return new THREE.ShapeGeometry(s)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    sweepAngle.current = (t * 0.5) % (Math.PI * 2)
    if (sweepRef.current) sweepRef.current.rotation.y = -sweepAngle.current

    if (coreRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 3)
      coreRef.current.scale.setScalar(0.8 + p * 0.4)
      coreRef.current.material.opacity = 0.8 + p * 0.2
    }
    if (coreGlowRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 2)
      coreGlowRef.current.scale.setScalar(1 + p * 0.5)
      coreGlowRef.current.material.opacity = 0.1 + p * 0.06
    }

    // Tier rim glow pulse
    tierGlowRefs.current.forEach((ref, i) => {
      if (ref) {
        const p = 0.5 + 0.5 * Math.sin(t * 1.5 + i * 1.2)
        ref.material.opacity = tiers[i].rimOpacity * (0.7 + p * 0.3)
      }
    })

    pulseRingRefs.current.forEach((ref, i) => {
      if (ref) {
        const c = ((t * 0.4 + i * 0.8) % 3)
        ref.scale.setScalar(0.3 + c * 0.4)
        ref.material.opacity = Math.max(0, 0.1 - c * 0.035)
      }
    })
  })

  return (
    <group>
      {/* ═══ 3D TIERED PLATFORM ═══ */}
      {tiers.map((tier, i) => (
        <group key={`tier-${i}`}>
          {/* Tier body (cylinder) */}
          <mesh position={[0, tier.y, 0]}>
            <cylinderGeometry args={[tier.radius, tier.radius, tier.height, 48, 1, false]} />
            <meshBasicMaterial color={tier.color} transparent opacity={0.6} />
          </mesh>
          {/* Tier edge glow (open cylinder — visible side walls) */}
          <mesh position={[0, tier.y, 0]} ref={el => tierGlowRefs.current[i] = el}>
            <cylinderGeometry args={[tier.radius, tier.radius, tier.height, 48, 1, true]} />
            <meshBasicMaterial color={tier.rimColor} transparent opacity={tier.rimOpacity} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* Tier top rim ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, tier.y + tier.height / 2 + 0.001, 0]}>
            <ringGeometry args={[tier.radius - 0.06, tier.radius, 48]} />
            <meshBasicMaterial color={tier.rimColor} transparent opacity={tier.rimOpacity * 1.5} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* ═══ SURFACE RINGS (on top of platform) ═══ */}
      {surfaceRings.map((ring, i) => (
        <line key={`sr-${i}`} geometry={ring.geo}>
          <lineBasicMaterial color="#00d4ff" transparent opacity={ring.opacity} />
        </line>
      ))}

      {/* ═══ TICK MARKS around outer edge ═══ */}
      {tickMarks.map((g, i) => (
        <line key={`tk-${i}`} geometry={g}>
          <lineBasicMaterial color="#00aacc" transparent opacity={i % 6 === 0 ? 0.2 : 0.08} />
        </line>
      ))}

      {/* ═══ RADIAL GRID LINES ═══ */}
      {radialLines.map((g, i) => (
        <line key={`rl-${i}`} geometry={g}>
          <lineBasicMaterial color="#00a0cc" transparent opacity={0.06} />
        </line>
      ))}

      {/* ═══ SCAN BEAM ═══ */}
      <group ref={sweepRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <primitive object={beamGeo} attach="geometry" />
          <meshBasicMaterial color="#00ffee" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 0]}>
          <primitive object={trailGeo} attach="geometry" />
          <meshBasicMaterial color="#00ccdd" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Leading edge line */}
        <line>
          <bufferGeometry><bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0.06, 0, 3.7, 0.06, 0])} itemSize={3} /></bufferGeometry>
          <lineBasicMaterial color="#00ffee" transparent opacity={0.8} />
        </line>
        {/* Vertical beam wall (rising from disk surface) */}
        <mesh position={[1.85, 0.25, 0]}>
          <planeGeometry args={[3.7, 0.35]} />
          <meshBasicMaterial color="#00eedd" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Beam tip */}
        <mesh position={[3.7, 0.06, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* ═══ ENERGY CORE (hovering above center) ═══ */}
      <mesh ref={coreRef} position={[0, 0.1, 0]}>
        <dodecahedronGeometry args={[0.1, 0]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.9} />
      </mesh>
      <mesh ref={coreGlowRef} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#00ccff" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* Core vertical beam */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 4]} />
        <meshBasicMaterial color="#00ddff" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* ═══ PULSE RINGS ═══ */}
      {[0, 1].map(i => (
        <mesh key={`pr-${i}`} ref={el => pulseRingRefs.current[i] = el} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.2, 0.25, 32]} />
          <meshBasicMaterial color="#00eeff" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
