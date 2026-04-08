import { useState, useCallback } from 'react'
import './App.css'
import RadarCard2D from './components/RadarCard2D'
import RadarScene from './components/RadarScene'
import { ExpandedCardOverlay } from './components/StarkSignals'
import { SIGNALS } from './data/signals'

function App() {
  const [phase, setPhase] = useState('card')
  const [activeBlip, setActiveBlip] = useState(null)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [expandedCard, setExpandedCard] = useState(null)

  const handleCardClick = useCallback(() => {
    if (phase !== 'card') return
    setPhase('expanding')
    setTimeout(() => setPhase('modal'), 700)
  }, [phase])

  const handleCollapse = useCallback(() => {
    if (phase !== 'modal') return
    setExpandedCard(null)
    setIsCollapsing(true)
    setPhase('collapsing')
  }, [phase])

  const handleCollapseComplete = useCallback(() => {
    setIsCollapsing(false)
    setActiveBlip(null)
    setExpandedCard(null)
    setPhase('reappearing')
    setTimeout(() => setPhase('card'), 600)
  }, [])

  const handleBlipClick = useCallback((blipData) => {
    setActiveBlip(prev => prev === blipData.id ? null : blipData.id)
  }, [])

  const handleExpandCard = useCallback((cardData) => {
    setExpandedCard(cardData)
    setActiveBlip(cardData.id)
  }, [])

  const handleCloseCard = useCallback(() => {
    setExpandedCard(null)
  }, [])

  const longCount = SIGNALS.filter(s => s.type === 'LONG').length
  const shortCount = SIGNALS.filter(s => s.type === 'SHORT').length
  const avgConf = Math.round(SIGNALS.reduce((a, s) => a + s.conf, 0) / SIGNALS.length)

  return (
    <>
      <div className="scanline-overlay" />

      {/* ═══ FLAT CARD VIEW ═══ */}
      {(phase === 'card' || phase === 'expanding' || phase === 'reappearing') && (
        <div className="dashboard">
          <div className="dashboard-title">⬡ BYTEBOOM.AI — SIGNAL INTELLIGENCE</div>
          <div className="dashboard-subtitle">CLICK RADAR TO ENTER 3D COMMAND VIEW</div>

          <div className={`radar-card ${phase === 'expanding' ? 'expanding' : ''} ${phase === 'reappearing' ? 'reappearing' : ''}`}>
            {phase !== 'expanding' && <RadarCard2D onClick={handleCardClick} />}
          </div>
        </div>
      )}

      {/* ═══ 3D MODAL VIEW ═══ */}
      {(phase === 'modal' || phase === 'collapsing') && (
        <div className="radar-modal-overlay">
          <div className="radar-modal-content">
            <RadarScene
              isCollapsing={isCollapsing}
              onCollapseComplete={handleCollapseComplete}
              onBlipClick={handleBlipClick}
              activeBlip={activeBlip}
              expandedCard={expandedCard}
              onExpandCard={handleExpandCard}
              onCloseCard={handleCloseCard}
            />
          </div>

          {/* Top HUD */}
          <div className="modal-hud-top">
            <div className="hud-left">
              <div className="hud-title">⬡ STARK INTELLIGENCE RADAR</div>
              <div className="hud-subtitle">HOLOGRAPHIC SCAN — CLICK CARDS TO EXPAND · DRAG TO REPOSITION</div>
            </div>
            <div className="hud-right">
              <div className="hud-stats">
                <div className="hud-stat">
                  <div className="hud-stat-value">{SIGNALS.length}</div>
                  <div className="hud-stat-label">Total</div>
                </div>
                <div className="hud-stat">
                  <div className="hud-stat-value" style={{ color: '#00ff9d' }}>{longCount}</div>
                  <div className="hud-stat-label">Long</div>
                </div>
                <div className="hud-stat">
                  <div className="hud-stat-value" style={{ color: '#ff6b6b' }}>{shortCount}</div>
                  <div className="hud-stat-label">Short</div>
                </div>
                <div className="hud-stat">
                  <div className="hud-stat-value" style={{ color: '#00e5ff' }}>{avgConf}%</div>
                  <div className="hud-stat-label">Avg Conf</div>
                </div>
              </div>
              <button className="collapse-btn" onClick={handleCollapse}>
                ◁ COLLAPSE
              </button>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="modal-hud-bottom">
            <div className="hud-instructions">
              <span>⟳</span> DRAG to rotate &nbsp;&nbsp;
              <span>⊕</span> SCROLL to zoom (into core!) &nbsp;&nbsp;
              <span>◉</span> CLICK card to expand &nbsp;&nbsp;
              <span>✋</span> DRAG cards to reposition &nbsp;&nbsp;
              <span>⇧</span> RIGHT-CLICK to pan
            </div>
            <div className="hud-timestamp">
              SYS.TIME {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>

          {/* ═══ EXPANDED CARD OVERLAY ═══ */}
          {expandedCard && (
            <ExpandedCardOverlay data={expandedCard} onClose={handleCloseCard} />
          )}
        </div>
      )}
    </>
  )
}

export default App
