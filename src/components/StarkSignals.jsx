import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { SIGNALS } from '../data/signals'

// ── Constants ──
const ARC_RADIUS = 5.5
const ARC_Y = 2.0
const MAX_VISIBLE = 5
const SIGNAL_LIFETIME = 60000
const DISCOVER_THRESHOLD = 0.2
const SPAWN_COOLDOWN = 3500

// Arc slot — moderate semicircle with good spacing
function getArcSlot(index, total) {
  const spread = Math.PI * 0.72
  const start = -spread / 2
  const step = total <= 1 ? 0 : spread / (total - 1)
  const angle = start + index * step
  return {
    pos: [Math.sin(angle) * ARC_RADIUS, ARC_Y + (index % 2) * 0.45, Math.cos(angle) * ARC_RADIUS],
    rot: [0, angle + Math.PI, 0],
  }
}

// Beacon position inside radar
function beaconPos(sig) {
  const r = sig.r * 3.2
  return [Math.cos(sig.angle) * r, 0.25, Math.sin(sig.angle) * r]
}

// ═══════════════════════════════════════════════════════════
// STARK CARD — HTML-styled card in 3D arc position
// Uses Html from drei for the styled UI, independently draggable
// ═══════════════════════════════════════════════════════════
function StarkCard({ data, slotIndex, totalCards, birthTime, onExpand, onExpired, controlsRef, isAnyExpanded }) {
  const groupRef = useRef()
  const beaconRef = useRef()
  const [dragOff, setDragOff] = useState([0, 0, 0])
  const dragging = useRef(false)
  const dragStartMouse = useRef(null)
  const { gl, camera } = useThree()
  const [age, setAge] = useState(0)

  // Age timer
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - birthTime
      setAge(elapsed)
      if (elapsed >= SIGNAL_LIFETIME) onExpired(data.id)
    }, 1000)
    return () => clearInterval(iv)
  }, [birthTime, data.id, onExpired])

  const slot = useMemo(() => getArcSlot(slotIndex, totalCards), [slotIndex, totalCards])
  const bPos = useMemo(() => beaconPos(data), [data])
  const worldPos = useMemo(() => [
    slot.pos[0] + dragOff[0], slot.pos[1] + dragOff[1], slot.pos[2] + dragOff[2]
  ], [slot.pos, dragOff])

  const timeLeft = Math.max(0, Math.ceil((SIGNAL_LIFETIME - age) / 1000))
  const isLong = data.type === 'LONG'
  const typeColor = isLong ? '#00ff9d' : '#ff6b6b'
  const confClass = data.conf >= 85 ? 'conf-high' : data.conf >= 75 ? 'conf-mid' : 'conf-low'
  const displayPrice = data.price || '—'
  const displayChange = data.change || '—'
  const displayVol = data.vol || '—'

  // Beacon pulse
  useFrame(() => {
    const t = performance.now() / 1000
    if (beaconRef.current) {
      beaconRef.current.material.opacity = 0.6 + Math.sin(t * 3 + data.id) * 0.3
      beaconRef.current.scale.setScalar(0.9 + Math.sin(t * 2.5 + data.id) * 0.15)
    }
  })

  // ── DOM drag handlers (on the HTML card itself) ──
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    dragging.current = true
    dragStartMouse.current = { x: e.clientX, y: e.clientY, off: [...dragOff] }
    gl.domElement.style.cursor = 'grabbing'
    if (controlsRef?.current) controlsRef.current.enabled = false

    const onMouseMove = (ev) => {
      if (!dragging.current || !dragStartMouse.current) return
      const dx = (ev.clientX - dragStartMouse.current.x) * 0.02
      const dy = -(ev.clientY - dragStartMouse.current.y) * 0.02
      setDragOff([
        dragStartMouse.current.off[0] + dx,
        dragStartMouse.current.off[1] + dy,
        dragStartMouse.current.off[2]
      ])
    }
    const onMouseUp = () => {
      dragging.current = false
      dragStartMouse.current = null
      gl.domElement.style.cursor = 'default'
      if (controlsRef?.current) controlsRef.current.enabled = true
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [dragOff, gl, controlsRef])

  const handleClick = useCallback((e) => {
    if (dragging.current) return
    e.stopPropagation()
    onExpand(data)
  }, [data, onExpand])

  return (
    <group ref={groupRef}>
      {/* ═══ BEACON — simple small dot ═══ */}
      <mesh ref={beaconRef} position={bPos}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={typeColor} transparent opacity={0.85} />
      </mesh>

      {/* ═══ CARD at arc position — HTML styled ═══ */}
      <group position={worldPos} rotation={slot.rot}>
        <Html
          transform
          distanceFactor={5}
          position={[0, 0, 0.02]}
          style={{ pointerEvents: isAnyExpanded ? 'none' : 'auto', display: isAnyExpanded ? 'none' : 'block' }}
        >
          <div
            className="stark-card"
            style={{ cursor: 'grab', width: 220, userSelect: 'none' }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
          >
            <div className="stark-corner tl" /><div className="stark-corner tr" />
            <div className="stark-corner bl" /><div className="stark-corner br" />
            <div className="stark-card-accent" style={{ background: data.color }} />

            <div className="stark-card-header">
              <span className="stark-card-symbol" style={{ color: data.color }}>{data.sym}</span>
              <span className={`stark-card-type ${isLong ? 'type-long' : 'type-short'}`}>
                <span className="type-dot" style={{ background: typeColor }} />
                {data.type}
              </span>
            </div>

            <div className="stark-card-price-row">
              <span className="stark-card-price">{'$'}{displayPrice}</span>
              <span className="stark-card-change" style={{ color: typeColor }}>{displayChange}</span>
            </div>

            <div className="stark-card-metrics">
              <div className="stark-metric">
                <span className="stark-metric-label">CONF</span>
                <span className={`stark-metric-value ${confClass}`}>{data.conf}%</span>
              </div>
              <div className="stark-metric">
                <span className="stark-metric-label">VOL</span>
                <span className="stark-metric-value">{displayVol}</span>
              </div>
              <div className="stark-metric">
                <span className="stark-metric-label">TTL</span>
                <span className="stark-metric-value" style={{ color: timeLeft < 10 ? '#ff6b6b' : '#00d4ff' }}>{timeLeft}s</span>
              </div>
            </div>

            <div className="stark-card-bar">
              <div className="stark-card-bar-fill" style={{ width: `${data.conf}%`, background: typeColor }} />
            </div>
          </div>
        </Html>
      </group>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════
// EXPANDED CARD OVERLAY (DOM — previous styled UI)
// ═══════════════════════════════════════════════════════════
function ExpandedCardOverlay({ data, onClose }) {
  if (!data) return null
  const typeColor = data.type === 'LONG' ? '#00ff9d' : '#ff6b6b'
  const confColor = data.conf >= 85 ? '#00d4ff' : data.conf >= 75 ? '#ffd60a' : '#ff6b6b'
  const displayPrice = data.price || '—'
  const displayChange = data.change || '—'
  const displayVol = data.vol || '—'
  const displayDesc = data.desc || 'Signal analysis pending...'

  return (
    <div className="stark-expanded-overlay" onClick={onClose}>
      <div className="stark-expanded-card" onClick={e => e.stopPropagation()}>
        <div className="expanded-border-glow" style={{ '--accent': data.color }} />
        <div className="expanded-accent" style={{ background: `linear-gradient(90deg, ${data.color}, ${data.color}44, transparent)` }} />
        <div className="expanded-header">
          <div className="expanded-symbol-group">
            <div className="expanded-symbol" style={{ color: data.color }}>{data.sym}</div>
            <div className="expanded-type-badge" style={{ background: `${typeColor}18`, borderColor: `${typeColor}44`, color: typeColor }}>
              <span className="type-dot" style={{ background: typeColor }} />{data.type} SIGNAL
            </div>
          </div>
          <button className="expanded-close" onClick={onClose}>✕</button>
        </div>
        <div className="expanded-price-section">
          <div className="expanded-price">{'$'}{displayPrice}</div>
          <div className="expanded-change" style={{ color: typeColor }}>{displayChange}</div>
        </div>
        <div className="expanded-stats-grid">
          <div className="expanded-stat"><div className="expanded-stat-label">CONFIDENCE</div>
            <div className="expanded-stat-value" style={{ color: confColor }}>{data.conf}%</div>
            <div className="expanded-stat-bar"><div style={{ width: `${data.conf}%`, background: confColor, height: '100%', borderRadius: 2 }} /></div></div>
          <div className="expanded-stat"><div className="expanded-stat-label">VOLUME</div><div className="expanded-stat-value">{displayVol}</div></div>
          <div className="expanded-stat"><div className="expanded-stat-label">RADIUS</div><div className="expanded-stat-value">{(data.r * 100).toFixed(0)}%</div></div>
          <div className="expanded-stat"><div className="expanded-stat-label">SIGNAL ID</div><div className="expanded-stat-value">SIG-{String(data.id).padStart(3, '0')}</div></div>
        </div>
        <div className="expanded-analysis"><div className="expanded-analysis-title"><span className="analysis-icon">◈</span> SIGNAL ANALYSIS</div><div className="expanded-analysis-text">{displayDesc}</div></div>
        <div className="expanded-actions">
          <button className="expanded-action-btn primary" style={{ borderColor: data.color, color: data.color }}>◆ EXECUTE TRADE</button>
          <button className="expanded-action-btn">◇ ADD TO WATCHLIST</button>
          <button className="expanded-action-btn">▤ FULL CHART</button>
        </div>
        <div className="expanded-corner tl" style={{ borderColor: data.color }} />
        <div className="expanded-corner tr" style={{ borderColor: data.color }} />
        <div className="expanded-corner bl" style={{ borderColor: data.color }} />
        <div className="expanded-corner br" style={{ borderColor: data.color }} />
        <div className="expanded-scanline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN SIGNAL SYSTEM
// ═══════════════════════════════════════════════════════════
export default function StarkSignals({ sweepAngleRef, onBlipClick, activeBlip, expandedCard, onExpandCard, onCloseCard, controlsRef }) {
  const [discovered, setDiscovered] = useState([])
  const lastSpawn = useRef(0)

  useFrame(() => {
    if (!sweepAngleRef?.current) return
    const sweep = sweepAngleRef.current.getSweepAngle()
    const now = Date.now()
    if (discovered.length < MAX_VISIBLE && now - lastSpawn.current > SPAWN_COOLDOWN) {
      const ids = new Set(discovered.map(d => d.id))
      for (const sig of SIGNALS) {
        if (ids.has(sig.id)) continue
        const diff = Math.abs(((sweep - sig.angle) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI)
        if (diff < DISCOVER_THRESHOLD) {
          setDiscovered(prev => {
            if (prev.length >= MAX_VISIBLE || prev.some(d => d.id === sig.id)) return prev
            return [...prev, { ...sig, birthTime: now }]
          })
          lastSpawn.current = now
          break
        }
      }
    }
  })

  const handleExpired = useCallback((id) => setDiscovered(prev => prev.filter(d => d.id !== id)), [])
  const handleExpand = useCallback((d) => onExpandCard(d), [onExpandCard])

  return (
    <>
      {discovered.map((sig, i) => (
        <StarkCard
          key={`${sig.id}-${sig.birthTime}`}
          data={sig}
          slotIndex={i}
          totalCards={discovered.length}
          birthTime={sig.birthTime}
          onExpand={handleExpand}
          onExpired={handleExpired}
          controlsRef={controlsRef}
          isAnyExpanded={!!expandedCard}
        />
      ))}
    </>
  )
}

export { ExpandedCardOverlay }
