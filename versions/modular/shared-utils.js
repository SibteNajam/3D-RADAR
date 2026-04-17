// ========================================
// SHARED DATA & UTILITIES
// VaultBot Dashboard Components
// ========================================

// ========================================
// DATA POOL
// ========================================

export const POOL = [
  { sym: 'BTC', pair: 'BTC/USDT', price: 64820, change: 3.42, vol: '$42.1B', dir: 'LONG', lev: '10x', pnl: 420.30 },
  { sym: 'ETH', pair: 'ETH/USDT', price: 3191, change: -1.18, vol: '$18.4B', dir: 'SHORT', lev: '5x', pnl: -88.50 },
  { sym: 'SOL', pair: 'SOL/USDT', price: 161, change: 5.67, vol: '$4.2B', dir: 'LONG', lev: '3x', pnl: 310.80 },
  { sym: 'BNB', pair: 'BNB/USDT', price: 594, change: 1.23, vol: '$1.8B', dir: 'LONG', lev: '7x', pnl: 199.70 },
  { sym: 'AVAX', pair: 'AVAX/USDT', price: 38.4, change: -2.11, vol: '$620M', dir: 'SHORT', lev: '4x', pnl: -44.20 },
  { sym: 'ARB', pair: 'ARB/USDT', price: 1.12, change: 7.34, vol: '$310M', dir: 'LONG', lev: '5x', pnl: 88.60 },
  { sym: 'LINK', pair: 'LINK/USDT', price: 14.82, change: 0.88, vol: '$540M', dir: 'LONG', lev: '3x', pnl: 22.10 },
  { sym: 'INJ', pair: 'INJ/USDT', price: 28.6, change: -3.44, vol: '$290M', dir: 'SHORT', lev: '6x', pnl: -61.40 },
  { sym: 'TIA', pair: 'TIA/USDT', price: 9.14, change: 4.12, vol: '$180M', dir: 'LONG', lev: '4x', pnl: 55.20 },
  { sym: 'WIF', pair: 'WIF/USDT', price: 2.34, change: 8.91, vol: '$120M', dir: 'LONG', lev: '5x', pnl: 124.60 },
  { sym: 'JUP', pair: 'JUP/USDT', price: 0.94, change: 6.21, vol: '$140M', dir: 'LONG', lev: '5x', pnl: 44.10 },
  { sym: 'SEI', pair: 'SEI/USDT', price: 0.52, change: -4.23, vol: '$95M', dir: 'SHORT', lev: '4x', pnl: -32.80 }
];

// ========================================
// COIN COLOR MAPPING
// ========================================

export const COIN_COLORS = {
  'BTC': { neon: '255,170,0', dark: '40,30,0', hex: '#ffaa00' },
  'ETH': { neon: '98,126,234', dark: '20,15,50', hex: '#627eea' },
  'SOL': { neon: '0,255,136', dark: '8,20,25', hex: '#00ff88' },
  'BNB': { neon: '240,165,23', dark: '40,30,0', hex: '#f0a517' },
  'AVAX': { neon: '232,65,66', dark: '40,15,15', hex: '#e84142' },
  'ARB': { neon: '40,185,239', dark: '15,25,50', hex: '#28b9ef' },
  'LINK': { neon: '84,71,255', dark: '15,12,50', hex: '#5447ff' },
  'INJ': { neon: '244,208,63', dark: '40,35,0', hex: '#f4d03f' },
  'TIA': { neon: '98,71,234', dark: '20,15,50', hex: '#6247ea' },
  'WIF': { neon: '139,95,191', dark: '30,20,45', hex: '#8b5fbf' },
  'JUP': { neon: '255,215,0', dark: '40,35,0', hex: '#ffd700' },
  'SEI': { neon: '32,185,163', dark: '10,30,25', hex: '#20b9a3' }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get coin colors by symbol
 * @param {string} symbol - Coin symbol (e.g., 'BTC', 'ETH')
 * @returns {object} Color object with neon, dark, and hex properties
 */
export function getCoinColors(symbol) {
  return COIN_COLORS[symbol] || { neon: '0,255,136', dark: '8,20,25', hex: '#00ff88' };
}

/**
 * Format price with proper decimals and commas
 * @param {number} p - Price value
 * @returns {string} Formatted price string
 */
export function formatPrice(p) {
  if (p >= 1000) {
    return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (p >= 10) {
    return '$' + p.toFixed(2);
  }
  return '$' + p.toFixed(3);
}

/**
 * Format PNL value with proper sign and decimals
 * @param {number} pnl - PNL value
 * @returns {string} Formatted PNL string
 */
export function formatPnl(pnl) {
  return (pnl >= 0 ? '+$' : '−$') + Math.abs(pnl).toFixed(2);
}

/**
 * Generate sparkline path data
 * @param {string} dir - Direction ('LONG' or 'SHORT')
 * @param {string} acc - Accent color
 * @returns {object} SVG path data
 */
export function makeSparkline(dir, acc) {
  const H = 40, W = 183;
  const pts = [];
  let v = H * 0.55;

  for (let i = 0; i < 22; i++) {
    v += (Math.random() - (dir === 'LONG' ? 0.40 : 0.60)) * 7;
    v = Math.max(5, Math.min(H - 5, v));
    pts.push([i / 21 * W, v]);
  }

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const area = line + ` L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];

  return {
    line,
    area,
    lx: last[0].toFixed(1),
    ly: last[1].toFixed(1)
  };
}

/**
 * Fetch cryptocurrency logo image
 * @param {string} sym - Coin symbol
 * @returns {Promise<HTMLImageElement|null>} Image element or null
 */
export async function fetchLogoImg(sym) {
  const name = sym.toLowerCase();
  const urls = [
    `https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/128/color/${name}.png`,
    `https://cryptologos.cc/logos/${name}-${name}-logo.png`
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, { mode: 'cors' });
      if (res.ok) {
        return await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = u;
        });
      }
    } catch (e) {
      // fallback to letter
    }
  }
  return null;
}

/**
 * Hash string to generate random colors
 * @param {string} str - Input string
 * @returns {object} Color object
 */
export function hashColorObj(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
  }
  const hue = Math.abs(h) % 360;
  const rgb = hslToRgb(hue / 360, 0.7, 0.5);
  return {
    neon: `${rgb[0]},${rgb[1]},${rgb[2]}`,
    dark: `${Math.floor(rgb[0] * 0.2)},${Math.floor(rgb[1] * 0.2)},${Math.floor(rgb[2] * 0.2)}`,
    hex: `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`
  };
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {number[]} RGB array
 */
export function hslToRgb(h, s, l) {
  let r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
