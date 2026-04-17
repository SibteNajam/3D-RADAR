# VaultBot Dashboard - Modular Components

This directory contains modularized versions of the VaultBot dashboard components, separated for easier React conversion and maintenance.

## 📁 File Structure

```
modular/
├── 01-rotating-ring-cards.html      # 3D rotating ring cards component
├── 02-horizontal-gamified-cards.html # Horizontal scrollable gamified cards
├── shared-utils.js                   # Shared data and utility functions
└── README.md                         # This file
```

## 🎯 Component Overview

### 1. Rotating Ring Cards (`01-rotating-ring-cards.html`)

**Features:**
- 3D rotating carousel of cryptocurrency cards rendered on Canvas
- Drag-to-rotate interaction with momentum physics
- Click-to-inspect popup modal with detailed position info
- Dynamic glow effects and glassmorphism styling
- Auto-fetches cryptocurrency logos from external APIs
- Depth-based scaling and opacity (cards in front are larger/brighter)
- Star field background with twinkling animation

**Key Technologies:**
- HTML5 Canvas API for rendering
- CSS3 for popup modal animations
- RequestAnimationFrame for smooth 60fps animation loop

**React Conversion Notes:**
- Use `useRef` for canvas element
- Use `useEffect` for animation loop and event listeners
- Use `useState` for popup visibility and selected card
- Consider using `react-three-fiber` for true 3D rendering (optional)

---

### 2. Horizontal Gamified Cards (`02-horizontal-gamified-cards.html`)

**Features:**
- Horizontally scrollable card list with smooth animations
- Cyberpunk/neon aesthetic with dynamic color theming
- Hover effects with lift, scale, and glow intensification
- SVG sparkline charts for each position
- Staggered entrance animations on load
- Glassmorphism card backgrounds
- Scan-line shimmer effect on hover

**Key Technologies:**
- CSS Grid and Flexbox for layout
- CSS custom properties for dynamic theming
- SVG for sparkline generation
- CSS transitions and transforms for animations

**React Conversion Notes:**
- Map over POOL data array to render cards
- Use CSS modules or styled-components for styling
- Consider using `framer-motion` for entrance/hover animations
- Use `useState` for hover states and click handlers

---

### 3. Shared Utilities (`shared-utils.js`)

**Exports:**
- `POOL` - Array of cryptocurrency position data
- `COIN_COLORS` - Color mapping for each coin
- `getCoinColors(symbol)` - Get colors for a specific coin
- `formatPrice(p)` - Format price with proper decimals
- `formatPnl(pnl)` - Format PNL with sign and decimals
- `makeSparkline(dir, acc)` - Generate SVG sparkline paths
- `fetchLogoImg(sym)` - Fetch crypto logo from external API
- `hashColorObj(str)` - Generate colors from string hash
- `hslToRgb(h, s, l)` - HSL to RGB color conversion

---

## 🔄 React Conversion Guide

### Step 1: Setup

```bash
npm create vite@latest vaultbot-react -- --template react
cd vaultbot-react
npm install
```

### Step 2: Convert Rotating Ring Cards

**File: `src/components/RotatingRingCards.jsx`**

```jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { POOL, getCoinColors, fetchLogoImg } from '../utils/shared-utils';

const RotatingRingCards = () => {
  const canvasRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const animationRef = useRef(null);
  
  // Ring state refs (to avoid re-renders during animation)
  const ringState = useRef({
    cards: [],
    velocity: 0.0038,
    isDragging: false,
    time: 0,
    // ... other state
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Initialize cards
    const initCards = async () => {
      const cards = POOL.slice(0, 7).map((data, i) => ({
        data,
        angle: (i / 7) * Math.PI * 2,
        logoImg: null
      }));
      
      // Fetch logos
      for (const card of cards) {
        const img = await fetchLogoImg(card.data.sym);
        if (img) card.logoImg = img;
      }
      
      ringState.current.cards = cards;
    };
    
    initCards();
    
    // Animation loop
    const animate = () => {
      // Drawing logic from HTML file
      // ...
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Event handlers for drag/click
  const handleMouseDown = useCallback((e) => {
    ringState.current.isDragging = true;
    // ... drag logic
  }, []);

  return (
    <div className="ring-section">
      <canvas 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {selectedCard && (
        <PopupModal 
          data={selectedCard} 
          onClose={() => setSelectedCard(null)} 
        />
      )}
    </div>
  );
};

export default RotatingRingCards;
```

**Key Conversion Points:**
1. Use refs for animation state to avoid unnecessary re-renders
2. Use `requestAnimationFrame` in useEffect with cleanup
3. Separate popup modal into its own component
4. Use useCallback for event handlers

---

### Step 3: Convert Horizontal Cards

**File: `src/components/HorizontalCards.jsx`**

```jsx
import { useState } from 'react';
import { POOL, getCoinColors, makeSparkline, formatPnl } from '../utils/shared-utils';
import './HorizontalCards.css';

const HorizontalCards = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="spread-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="accent">●</span>Position Spread
        </h2>
        <button className="view-all-btn">VIEW ALL</button>
      </div>
      
      <div className="track-wrapper">
        <div className="track">
          {POOL.map((data, index) => {
            const colors = getCoinColors(data.sym);
            const isPositive = data.change >= 0;
            const sparkline = makeSparkline(
              data.dir, 
              isPositive ? '#4DB86A' : '#D65C5C'
            );
            
            return (
              <div
                key={data.sym}
                className={`spc ${isPositive ? 'positive' : 'negative'}`}
                style={{
                  '--acc': isPositive ? '#4DB86A' : '#D65C5C',
                  '--acc-glow': `rgba(${colors.neon}, 0.12)`,
                  animationDelay: `${index * 70}ms`
                }}
                onMouseEnter={() => setHoveredCard(data.sym)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => console.log('Clicked:', data.sym)}
              >
                <div className="spc-top">
                  <div className="spc-icon">{data.sym.charAt(0)}</div>
                  <div className="spc-pill">
                    {isPositive ? '▲' : '▼'} {data.dir}
                  </div>
                </div>
                
                <div className="spc-sym">{data.sym}</div>
                <div className="spc-pair">{data.pair} · {data.lev}</div>
                
                <div className="spc-pnl-lbl">TOTAL PNL</div>
                <div className="spc-pnl">{formatPnl(data.pnl)}</div>
                
                <div className="spc-stats">
                  <div className="spc-stat">
                    <div className="spc-stat-lbl">WIN RATE</div>
                    <div className="spc-stat-val">{isPositive ? '68' : '54'}%</div>
                  </div>
                  <div className="spc-stat">
                    <div className="spc-stat-lbl">CHANGE</div>
                    <div className="spc-stat-val acc">
                      {isPositive ? '+' : ''}{data.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="spc-spark">
                  <svg viewBox="0 0 183 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`grad-${index}`}>
                        <stop offset="0%" stopColor={isPositive ? '#4DB86A' : '#D65C5C'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isPositive ? '#4DB86A' : '#D65C5C'} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={sparkline.area} fill={`url(#grad-${index})`} />
                    <path d={sparkline.line} fill="none" stroke={isPositive ? '#4DB86A' : '#D65C5C'} strokeWidth="1.5" />
                    <circle cx={sparkline.lx} cy={sparkline.ly} r="2.5" fill={isPositive ? '#4DB86A' : '#D65C5C'} />
                  </svg>
                </div>
                
                <div className="spc-footer">
                  <div className="spc-time">{Math.floor(Math.random() * 12) + 1}h ago</div>
                  <div className="spc-action">INSPECT →</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HorizontalCards;
```

**CSS File: `src/components/HorizontalCards.css`**
- Copy CSS from `02-horizontal-gamified-cards.html`
- Convert to CSS modules or keep as regular CSS
- Add animation keyframes for entrance effects

**Key Conversion Points:**
1. Map over POOL array directly in JSX
2. Use inline styles for dynamic CSS variables
3. Extract sparkline SVG to separate component if needed
4. Use CSS transitions instead of JS animations where possible

---

### Step 4: Optional Enhancements

**Using Framer Motion for Animations:**

```bash
npm install framer-motion
```

```jsx
import { motion } from 'framer-motion';

// Replace CSS animations with Framer Motion
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.07, duration: 0.6 }}
  whileHover={{ y: -22, scale: 1.025 }}
  className="spc"
>
  {/* card content */}
</motion.div>
```

**Using React Three Fiber for 3D Ring (Advanced):**

```bash
npm install three @react-three/fiber @react-three/drei
```

This would replace the Canvas 2D rendering with actual 3D geometry.

---

## 🎨 Styling Approach

### Option 1: CSS Modules (Recommended)
```
components/
├── RotatingRingCards.jsx
├── RotatingRingCards.module.css
├── HorizontalCards.jsx
└── HorizontalCards.module.css
```

### Option 2: Styled Components
```bash
npm install styled-components
```

```jsx
import styled from 'styled-components';

const SpreadCard = styled.div`
  width: 215px;
  height: 330px;
  background: linear-gradient(145deg, rgba(16, 21, 38, 0.94), rgba(9, 12, 24, 0.98));
  border-radius: 14px;
  /* ... rest of styles */
`;
```

### Option 3: Tailwind CSS
```bash
npm install -D tailwindcss
npx tailwindcss init
```

Configure tailwind.config.js with custom colors and use utility classes.

---

## 📊 Data Flow

```
shared-utils.js (Data & Utilities)
    ↓
RotatingRingCards.jsx    HorizontalCards.jsx
    ↓                        ↓
PopupModal.jsx           (Card Click Handler)
```

Both components import from `shared-utils.js` for:
- Cryptocurrency data (POOL)
- Color schemes (COIN_COLORS)
- Formatting functions
- Logo fetching

---

## 🚀 Performance Tips

1. **Canvas Optimization:**
   - Use `will-change: transform` on canvas
   - Batch draw calls where possible
   - Use `requestAnimationFrame` for smooth animations

2. **React Optimization:**
   - Use `useMemo` for expensive calculations
   - Use `React.memo` for card components
   - Lazy load popup modal with `React.lazy`

3. **Image Optimization:**
   - Cache logo images in localStorage
   - Use placeholder initials while loading
   - Implement error fallbacks

---

## 🧪 Testing

```bash
npm install -D @testing-library/react @testing-library/jest-dom
```

Test components:
- Card rendering with different data
- Hover interactions
- Click handlers
- Animation states
- Responsive layouts

---

## 📝 Migration Checklist

- [ ] Setup React project with Vite
- [ ] Copy shared-utils.js to src/utils/
- [ ] Create RotatingRingCards component
- [ ] Create HorizontalCards component
- [ ] Create PopupModal component
- [ ] Convert CSS to CSS modules or styled-components
- [ ] Test drag/rotate interactions
- [ ] Test click/hover animations
- [ ] Optimize performance
- [ ] Add responsive breakpoints
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Deploy and test

---

## 🤝 Support

For questions or issues:
1. Check the original HTML files for reference
2. Compare with vaultfullv1.html for complete integration
3. Test each component independently before combining

---

## 📄 License

This code is part of the VaultBot Dashboard project.
