/* ═══════════════════════════════════════════
   03-popup-card.js — VaultBot Popup Card
   Extracted from vaultfullv1.html ring module
   
   Usage:
     1. Include 03-popup-card.css via <link>
     2. Include this script via <script src="03-popup-card.js">
     3. Call initPopup() after DOM is ready
     4. Call openPopup(data) to show the popup
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  let popupOverlay, popupClose, popupContent;

  /** Inject popup HTML into the DOM and wire up event listeners */
  function initPopup() {
    // Inject overlay HTML if not already present
    if (!document.getElementById('popupOverlay')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <div id="popupOverlay" class="popup-overlay">
          <div class="popup-card" id="popupCard">
            <button class="popup-close" id="popupClose">×</button>
            <div id="popupContent"></div>
          </div>
        </div>
      `;
      document.body.appendChild(wrapper.firstElementChild);
    }

    popupOverlay = document.getElementById('popupOverlay');
    popupClose   = document.getElementById('popupClose');
    popupContent = document.getElementById('popupContent');

    popupClose.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) closePopup();
    });
  }

  /** Open popup with trade data object */
  function openPopup(data) {
    if (!popupOverlay) initPopup();

    const ip = data.change >= 0;
    const acc = ip ? '#4DB86A' : '#D65C5C';
    const pnlVal = (data.pnl >= 0 ? '+$' : '−$') + Math.abs(data.pnl).toFixed(2);
    const changePct = (ip ? '+' : '') + data.change.toFixed(2) + '%';
    const winRateNum = ip ? 68.4 : 54.2;
    const avgProfit = ip ? '+$' + (Math.abs(data.pnl) * 0.42).toFixed(2) : '-$' + (Math.abs(data.pnl) * 0.28).toFixed(2);
    const maxDD = '-$' + (Math.abs(data.pnl) * 0.28).toFixed(2);

    // Calculate SLTP levels
    const livePrice = data.price * (1 + (Math.random() * 0.02 - 0.005));
    const entryPrice = data.price;
    const tpPrice = ip ? data.price * 1.05 : data.price * 0.95;
    const lockPrice = ip ? data.price * 1.02 : data.price * 0.98;
    const slPrice = ip ? data.price * 0.92 : data.price * 1.08;

    // Format price helper
    const fmtP = (p) => p >= 1000 ? '$' + p.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : p >= 10 ? '$' + p.toFixed(2) : '$' + p.toFixed(4);

    // Calculate positions (0% = bottom/SL, 100% = top/TP)
    const priceRange = Math.abs(tpPrice - slPrice);
    const nodePos = (price) => {
      if (ip) return ((price - slPrice) / priceRange) * 100;
      return ((slPrice - price) / priceRange) * 100;
    };
    const tpPos = 100;
    const lockPos = nodePos(lockPrice);
    const entryPos = nodePos(entryPrice);
    const currentPos = Math.max(0, Math.min(100, nodePos(livePrice)));
    const slPos = 0;

    // Determine current price zone color
    const inProfit = ip ? livePrice > lockPrice : livePrice < lockPrice;
    const currentDotClass = inProfit ? '' : 'neg';
    const livePnlVal = ((livePrice - entryPrice) / entryPrice * 100);
    const livePnlStr = (livePnlVal >= 0 ? '+' : '') + livePnlVal.toFixed(2) + '%';

    popupContent.innerHTML = `
      <div class="cm-header">
        <div class="cm-logo" style="border-color:${acc}30">
          <span class="cm-letter" style="color:${acc}">${data.sym.charAt(0)}</span>
          <div class="cm-logo-ring" style="border-top-color:${acc}"></div>
        </div>
        <div class="cm-header-info">
          <div class="cm-sym">${data.sym}USDT</div>
          <div class="cm-pair">${data.pair} PERPETUAL</div>
          <div class="cm-badge" style="border-color:${acc}30;background:${acc}0a;color:${acc}">
            <span class="cm-badge-dot" style="background:${acc}"></span>${ip ? 'ACTIVE' : 'AT RISK'}
          </div>
        </div>
      </div>

      <div class="cm-body-split">
        <!-- LEFT: Info panels -->
        <div class="cm-body-left">
          <div class="cm-pnl-section">
            <div class="cm-price-row">
              <span class="cm-price">$${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span class="cm-change ${ip ? 'up' : 'down'}">${changePct}</span>
            </div>
            <div class="cm-pnl-label">TOTAL PNL</div>
            <div class="cm-pnl ${ip ? 'pos' : 'neg'}" style="color:${acc}">${pnlVal}</div>
          </div>

          <div class="cm-stats">
            <div class="cm-stat">
              <div class="cm-stat-label">DIRECTION</div>
              <div class="cm-stat-val" style="color:${acc}">${data.dir}</div>
            </div>
            <div class="cm-stat">
              <div class="cm-stat-label">LEVERAGE</div>
              <div class="cm-stat-val">${data.lev}</div>
            </div>
            <div class="cm-stat">
              <div class="cm-stat-label">AVG PROFIT</div>
              <div class="cm-stat-val" style="color:${acc}">${avgProfit}</div>
            </div>
            <div class="cm-stat">
              <div class="cm-stat-label">MAX DRAWDOWN</div>
              <div class="cm-stat-val" style="color:#D65C5C">${maxDD}</div>
            </div>
          </div>

          <div class="cm-winrate-section">
            <div class="cm-wr-header">
              <span class="cm-wr-label">WIN RATE</span>
              <span class="cm-wr-val" style="color:${acc}">${winRateNum}%</span>
            </div>
            <div class="cm-wr-track">
              <div class="cm-wr-fill" style="width:0%;background:${acc}"></div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Price tracker bar (vertical bar UI) -->
        <div class="cm-body-right">
          <div class="vb-tracker-wrap">
            <div class="vb-tracker-header">
              <span class="vb-tracker-pair">${data.sym}<em>USDT</em></span>
              <span class="vb-long-badge${ip ? '' : ' short'}">${ip ? '▲ LONG' : '▼ SHORT'}</span>
            </div>

            <div class="vb-column">
              <div class="vb-labels-left">
                <div class="vb-label-left tp-color" style="top:${100 - tpPos}%">
                  <div class="vb-lbl-tag tp-color">TP</div>
                  <div class="vb-lbl-price">${fmtP(tpPrice)}</div>
                </div>
                <div class="vb-label-left tl-color" style="top:${100 - lockPos}%">
                  <div class="vb-lbl-tag tl-color">TL</div>
                  <div class="vb-lbl-price">${fmtP(lockPrice)}</div>
                </div>
                <div class="vb-label-left e-color" style="top:${100 - entryPos}%">
                  <div class="vb-lbl-tag e-color">E</div>
                  <div class="vb-lbl-price">${fmtP(entryPrice)}</div>
                </div>
                <div class="vb-label-left sl-color" style="top:${100 - slPos}%">
                  <div class="vb-lbl-tag sl-color">SL</div>
                  <div class="vb-lbl-price">${fmtP(slPrice)}</div>
                </div>
              </div>

              <div class="vb-track-col">
                <div class="vb-track">
                  <div class="vb-fill-profit" style="height:${100 - currentPos}%"></div>
                  <div class="vb-fill-entry-lock" style="top:${100 - lockPos}%;height:${lockPos - entryPos}%"></div>
                  <div class="vb-fill-loss"></div>
                  <div class="vb-mkt-dot${currentDotClass ? ' neg' : ''}" style="top:${100 - currentPos}%"></div>
                  <div class="vb-tick tp-tick" style="top:${100 - tpPos}%"><div class="vb-tick-dash"></div></div>
                  <div class="vb-tick tl-tick" style="top:${100 - lockPos}%"><div class="vb-tick-dash"></div></div>
                  <div class="vb-tick e-tick" style="top:${100 - entryPos}%"><div class="vb-tick-dash"></div></div>
                  <div class="vb-tick sl-tick" style="top:${100 - slPos}%"><div class="vb-tick-dash"></div></div>
                </div>
              </div>

              <div class="vb-labels-right">
                <div class="vb-label-right mk-color" style="top:${100 - currentPos}%">
                  <div class="vb-lbl-tag mk-color">${fmtP(livePrice)}</div>
                  <div class="vb-lbl-price mk-color">NOW</div>
                </div>
              </div>
            </div>

            <div class="vb-footer">
              <div class="vb-stat">
                <div class="vb-stat-lbl">LIVE P&L</div>
                <div class="vb-stat-val" style="color:${acc}">${livePnlVal >= 0 ? '+' : ''}${livePnlStr}</div>
              </div>
              <div class="vb-stat" style="text-align:right">
                <div class="vb-stat-lbl">LOCK P&L</div>
                <div class="vb-stat-val" style="color:#ffc107">+${((lockPrice - entryPrice) / entryPrice * 100).toFixed(2)}%</div>
              </div>
              <div class="vb-stat">
                <div class="vb-stat-lbl">PNL</div>
                <div class="vb-stat-val" style="color:${acc}">${pnlVal}</div>
              </div>
              <div class="vb-stat" style="text-align:right">
                <div class="vb-stat-lbl">LEVERAGE</div>
                <div class="vb-stat-val" style="color:rgba(255,255,255,0.7)">${data.lev}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cm-bottom">
        <div class="cm-bottom-item"><div class="cm-bottom-label">VOLUME</div><div class="cm-bottom-val">${data.vol}</div></div>
        <div class="cm-bottom-item"><div class="cm-bottom-label">TRADES</div><div class="cm-bottom-val">${Math.floor(12 + Math.random() * 30)}</div></div>
        <div class="cm-bottom-item"><div class="cm-bottom-label">TIME</div><div class="cm-bottom-val">${Math.floor(Math.random() * 12) + 1}h ${Math.floor(Math.random() * 60)}m ago</div></div>
      </div>
    `;

    popupOverlay.classList.add('visible');

    // Animate win rate bar after modal opens
    setTimeout(() => {
      const fill = popupContent.querySelector('.cm-wr-fill');
      if (fill) fill.style.width = winRateNum + '%';
    }, 50);
  }

  /** Close the popup */
  function closePopup() {
    if (popupOverlay) popupOverlay.classList.remove('visible');
  }

  // Expose to global scope so ring cards can call them
  window.VaultBotPopup = {
    init: initPopup,
    open: openPopup,
    close: closePopup
  };

  // Also expose openPopup/closePopup as globals for backward compatibility
  window.openPopup = openPopup;
  window.closePopup = closePopup;
  window.initPopup = initPopup;
})();
