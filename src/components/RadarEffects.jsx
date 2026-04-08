import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* AMBIENT EFFECTS — clean cyan/teal scheme */
export default function RadarEffects() {
  const particlesRef = useRef()
  const dustRef = useRef()
  const orbitalRef = useRef()

  const particleCount = 120
  const particlePositions = useMemo(() => {
    const p = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 6 + Math.random() * 12
      p[i*3] = r * Math.sin(ph) * Math.cos(th); p[i*3+1] = r * Math.sin(ph) * Math.sin(th) - 2; p[i*3+2] = r * Math.cos(ph)
    }
    return p
  }, [])

  const dustCount = 40
  const dustPositions = useMemo(() => {
    const p = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) { p[i*3] = (Math.random()-0.5)*24; p[i*3+1] = (Math.random()-0.5)*18+2; p[i*3+2] = (Math.random()-0.5)*24 }
    return p
  }, [])

  const orbitalCount = 30
  const orbitalData = useMemo(() => {
    const p = new Float32Array(orbitalCount * 3), sp = new Float32Array(orbitalCount), ra = new Float32Array(orbitalCount), of = new Float32Array(orbitalCount), yo = new Float32Array(orbitalCount)
    for (let i = 0; i < orbitalCount; i++) { ra[i]=4+Math.random()*6; of[i]=Math.random()*Math.PI*2; sp[i]=0.05+Math.random()*0.15; yo[i]=(Math.random()-0.5)*3; p[i*3]=Math.cos(of[i])*ra[i]; p[i*3+1]=yo[i]; p[i*3+2]=Math.sin(of[i])*ra[i] }
    return { positions: p, speeds: sp, radii: ra, offsets: of, yOffsets: yo }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (particlesRef.current) particlesRef.current.rotation.y = t * 0.008
    if (dustRef.current) dustRef.current.rotation.y = -t * 0.004
    if (orbitalRef.current) {
      const pos = orbitalRef.current.geometry.attributes.position
      for (let i = 0; i < orbitalCount; i++) {
        const a = orbitalData.offsets[i] + t * orbitalData.speeds[i]
        pos.setX(i, Math.cos(a) * orbitalData.radii[i]); pos.setY(i, orbitalData.yOffsets[i] + Math.sin(t*0.3+i)*0.15); pos.setZ(i, Math.sin(a) * orbitalData.radii[i])
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group>
      <points ref={particlesRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={particleCount} array={particlePositions} itemSize={3} /></bufferGeometry>
        <pointsMaterial color="#0088aa" size={0.012} transparent opacity={0.22} sizeAttenuation depthWrite={false} /></points>
      <points ref={dustRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={dustCount} array={dustPositions} itemSize={3} /></bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.004} transparent opacity={0.08} sizeAttenuation depthWrite={false} /></points>
      <points ref={orbitalRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={orbitalCount} array={orbitalData.positions} itemSize={3} /></bufferGeometry>
        <pointsMaterial color="#00bbdd" size={0.008} transparent opacity={0.15} sizeAttenuation depthWrite={false} /></points>
    </group>
  )
}
