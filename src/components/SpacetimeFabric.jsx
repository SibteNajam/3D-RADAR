import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GRID_SIZE = 24
const GRID_SEGMENTS = 80
const WELL_DEPTH = 2.8
const WELL_RADIUS = 3.5
const RIPPLE_SPEED = 0.4
const RIPPLE_AMP = 0.08

/*
  SPACETIME FABRIC — DARK STEEL/TEAL
  Very subtle background that doesn't compete with the bright cyan radar.
  Grid: #152535 steel-blue on near-black #050a14
*/
export default function SpacetimeFabric() {
  const meshRef = useRef()

  const { gridGeo } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_SEGMENTS, GRID_SEGMENTS)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const r = Math.sqrt(x * x + z * z)
      const well = -WELL_DEPTH / (1 + Math.pow(r / WELL_RADIUS, 2))
      const steep = -0.8 * Math.exp(-r * r / 1.5)
      pos.setY(i, well + steep)
      const intensity = Math.exp(-r * r / 18)
      const f = 0.06 + intensity * 0.35
      colors[i * 3]     = 0.05 * f  // R — minimal
      colors[i * 3 + 1] = 0.28 * f  // G — teal tint
      colors[i * 3 + 2] = 0.55 * f  // B — steel blue
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return { gridGeo: geo }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const pos = geo.attributes.position
    const colors = geo.attributes.color
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const r = Math.sqrt(x * x + z * z)
      const well = -WELL_DEPTH / (1 + Math.pow(r / WELL_RADIUS, 2))
      const steep = -0.8 * Math.exp(-r * r / 1.5)
      const r1 = Math.sin(r * 1.2 - t * RIPPLE_SPEED * 2) * RIPPLE_AMP * Math.exp(-r * 0.12)
      const r2 = Math.sin(r * 0.6 - t * RIPPLE_SPEED) * RIPPLE_AMP * 0.5 * Math.exp(-r * 0.08)
      const breathe = Math.sin(t * 0.3) * 0.05
      pos.setY(i, well + steep + r1 + r2 + breathe * well * 0.1)
      const intensity = Math.exp(-r * r / 18)
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.8)
      const glow = 0.06 + intensity * (0.3 + pulse * 0.1)
      const rg = Math.max(0, Math.sin(r * 1.2 - t * RIPPLE_SPEED * 2)) * 0.06 * Math.exp(-r * 0.15)
      colors.setXYZ(i, (0.05 + rg * 0.3) * glow, (0.28 + rg * 0.5) * glow, (0.55 + rg * 0.2) * glow)
    }
    pos.needsUpdate = true
    colors.needsUpdate = true
  })

  const geodesics = useMemo(() => {
    const curves = []
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const pts = []
      for (let j = 0; j <= 100; j++) {
        const t = (j / 100) * GRID_SIZE - GRID_SIZE / 2
        const x = t * Math.cos(angle) + Math.sin(angle) * 2
        const z = t * Math.sin(angle) - Math.cos(angle) * 2
        const r = Math.sqrt(x * x + z * z)
        pts.push(new THREE.Vector3(x, -WELL_DEPTH / (1 + Math.pow(r / WELL_RADIUS, 2)) - 0.8 * Math.exp(-r * r / 1.5) + 0.02, z))
      }
      curves.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    return curves
  }, [])

  const horizonRing = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2, r = 1.8
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      pts.push(new THREE.Vector3(x, -WELL_DEPTH / (1 + Math.pow(r / WELL_RADIUS, 2)) - 0.8 * Math.exp(-r * r / 1.5) + 0.03, z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  return (
    <group>
      <mesh ref={meshRef} geometry={gridGeo}>
        <meshBasicMaterial color="#050a14" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} vertexColors />
      </mesh>
      <mesh geometry={gridGeo}>
        <meshBasicMaterial wireframe color="#152535" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh geometry={gridGeo}>
        <meshBasicMaterial wireframe vertexColors transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {geodesics.map((g, i) => (<line key={`gd-${i}`} geometry={g}><lineBasicMaterial color="#1a3545" transparent opacity={0.04} /></line>))}
      <line geometry={horizonRing}><lineBasicMaterial color="#0088aa" transparent opacity={0.18} /></line>
      <mesh position={[0, -WELL_DEPTH - 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} /><meshBasicMaterial color="#0a1525" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, -WELL_DEPTH - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 32]} /><meshBasicMaterial color="#040810" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}
