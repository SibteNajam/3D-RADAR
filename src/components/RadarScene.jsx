import { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import HoloRadar3D from './HoloRadar3D'
import StarkSignals from './StarkSignals'
import RadarEffects from './RadarEffects'
import SpacetimeFabric from './SpacetimeFabric'

function CameraController({ isCollapsing, onCollapseComplete }) {
  const { camera } = useThree()
  const startTime = useRef(Date.now())
  const collapseStart = useRef(null)
  const targetPos = useRef(new THREE.Vector3(4, 3, -7))

  useEffect(() => {
    camera.position.set(0, 18, -25)
    camera.lookAt(0, 0, 0)
    startTime.current = Date.now()
  }, [camera])

  useEffect(() => {
    if (isCollapsing) collapseStart.current = Date.now()
  }, [isCollapsing])

  useFrame(() => {
    if (isCollapsing && collapseStart.current) {
      const elapsed = (Date.now() - collapseStart.current) / 1000
      const t = Math.min(elapsed / 1.0, 1)
      const ease = t * t * t
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 30, ease * 0.04)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, -55, ease * 0.04)
      camera.lookAt(0, 0, 0)
      if (t >= 1) onCollapseComplete()
      return
    }
    const elapsed = (Date.now() - startTime.current) / 1000
    if (elapsed < 3) {
      const t = Math.min(elapsed / 2.8, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      camera.position.x = THREE.MathUtils.lerp(0, targetPos.current.x, ease)
      camera.position.y = THREE.MathUtils.lerp(18, targetPos.current.y, ease)
      camera.position.z = THREE.MathUtils.lerp(-25, targetPos.current.z, ease)
      camera.lookAt(0, 0, 0)
    }
  })

  return null
}

function RadarSceneContent({ isCollapsing, onCollapseComplete, onBlipClick, activeBlip, expandedCard, onExpandCard, onCloseCard }) {
  const sweepAngleRef = useRef()
  const controlsRef = useRef()

  return (
    <>
      <CameraController isCollapsing={isCollapsing} onCollapseComplete={onCollapseComplete} />

      {/* FREE CAMERA — orbit controls with ref for drag disable */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        enablePan={true}
        enableZoom={true}
        minDistance={0.5}
        maxDistance={30}
        enabled={!isCollapsing}
        maxPolarAngle={Math.PI * 0.95}
        minPolarAngle={Math.PI * 0.02}
        target={[0, 0, 0]}
        panSpeed={0.8}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
      />

      <ambientLight intensity={0.05} />
      <pointLight position={[5, 10, 5]} intensity={0.12} color="#00ccff" />
      <pointLight position={[-5, 8, -5]} intensity={0.06} color="#0088cc" />
      <pointLight position={[0, -3, 0]} intensity={0.04} color="#003355" />
      <pointLight position={[0, 5, 0]} intensity={0.05} color="#00ddff" />

      {/* ═══ SPACETIME FABRIC ═══ */}
      <SpacetimeFabric />

      {/* ═══ 3D HOLOGRAPHIC RADAR ═══ */}
      <group position={[0, 0, 0]}>
        <HoloRadar3D sweepAngleRef={sweepAngleRef} />
        <StarkSignals
          sweepAngleRef={sweepAngleRef}
          onBlipClick={onBlipClick}
          activeBlip={activeBlip}
          expandedCard={expandedCard}
          onExpandCard={onExpandCard}
          onCloseCard={onCloseCard}
          controlsRef={controlsRef}
        />
      </group>

      {/* ═══ AMBIENT EFFECTS ═══ */}
      <RadarEffects />
    </>
  )
}

export default function RadarScene({ isCollapsing, onCollapseComplete, onBlipClick, activeBlip, expandedCard, onExpandCard, onCloseCard }) {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.01, far: 200, position: [0, 18, -25] }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#030810']} />
      <fog attach="fog" args={['#030810', 20, 50]} />

      <RadarSceneContent
        isCollapsing={isCollapsing}
        onCollapseComplete={onCollapseComplete}
        onBlipClick={onBlipClick}
        activeBlip={activeBlip}
        expandedCard={expandedCard}
        onExpandCard={onExpandCard}
        onCloseCard={onCloseCard}
      />
    </Canvas>
  )
}
