import React from 'react';

/**
 * ChargeSphereLogo Component
 * Accurately replicates the ChargeSphere™ glowing neon brand emblem:
 * - Neon green glowing ring
 * - Organic dual leaves on bottom-left
 * - Pure white electric lightning bolt in center
 * - EV charging connector nozzle on right
 * - "ChargeSphere™" typography with white "Charge", gradient green "Sphere"
 * - Sub-tagline: "CLEAN MOBILITY • SMARTER GRIDS • BRIGHTER TOMORROW"
 */
export default function ChargeSphereLogo({
  layout = 'horizontal', // 'horizontal' | 'vertical' | 'icon-only'
  size = 'md',          // 'sm' | 'md' | 'lg' | 'xl'
  showTagline = true,
  className = '',
  style = {}
}) {
  // Dimensions map
  const dimensions = {
    sm: { icon: 32, fontSize: 16, tmSize: 8, taglineSize: 7, gap: 10 },
    md: { icon: 42, fontSize: 20, tmSize: 9, taglineSize: 8, gap: 12 },
    lg: { icon: 64, fontSize: 28, tmSize: 11, taglineSize: 9.5, gap: 16 },
    xl: { icon: 88, fontSize: 38, tmSize: 13, taglineSize: 11, gap: 20 },
  }[size] || { icon: 42, fontSize: 20, tmSize: 9, taglineSize: 8, gap: 12 };

  const isVertical = layout === 'vertical';
  const iconSize = dimensions.icon;

  const iconSvg = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.75)) drop-shadow(0 0 4px rgba(74, 222, 128, 0.9))'
      }}
    >
      <defs>
        {/* Glow Filters */}
        <filter id="cs-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Ring & Border Gradient */}
        <linearGradient id="cs-ring-grad" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="80%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>

        {/* Inner Backdrop Gradient */}
        <radialGradient id="cs-backdrop" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#08210f" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#020d05" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </radialGradient>

        {/* Lightning Bolt Gradient */}
        <linearGradient id="cs-bolt-grad" x1="50" y1="18" x2="70" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#bbf7d0" />
        </linearGradient>

        {/* Primary Leaf Gradient */}
        <linearGradient id="cs-leaf-grad" x1="10" y1="50" x2="45" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="35%" stopColor="#4ade80" />
          <stop offset="75%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Secondary Leaf Gradient */}
        <linearGradient id="cs-leaf2-grad" x1="25" y1="75" x2="52" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>

        {/* EV Plug Gradient */}
        <linearGradient id="cs-plug-grad" x1="88" y1="50" x2="108" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#dcfce7" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>

        {/* Wordmark Gradient */}
        <linearGradient id="cs-sphere-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="35%" stopColor="#4ade80" />
          <stop offset="70%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Inner background disc */}
      <circle cx="60" cy="60" r="48" fill="url(#cs-backdrop)" />

      {/* Main Glowing Ring (Broken near plug and leaf) */}
      <circle
        cx="60"
        cy="60"
        r="48"
        stroke="url(#cs-ring-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Subtle Inner Highlight Ring */}
      <circle
        cx="60"
        cy="60"
        r="44"
        stroke="#86efac"
        strokeWidth="1"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* --- CENTER: ELECTRIC LIGHTNING BOLT --- */}
      <path
        d="M68 20L44 56H62L54 94L82 50H63L68 20Z"
        fill="url(#cs-bolt-grad)"
        filter="drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 16px rgba(74, 222, 128, 0.8))"
      />

      {/* --- BOTTOM LEFT: ORGANIC ECO LEAF --- */}
      {/* Large sweeping outer leaf */}
      <path
        d="M16 88C14 70 24 50 42 42C44 58 38 78 22 92C18 94 15 91 16 88Z"
        fill="url(#cs-leaf-grad)"
        filter="drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))"
      />
      {/* Leaf center vein highlight */}
      <path
        d="M17 88C24 74 32 62 42 42"
        stroke="#bbf7d0"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      {/* Small accent leaf nestling below */}
      <path
        d="M30 92C32 80 44 74 54 74C52 84 46 94 36 98C32 99 29 96 30 92Z"
        fill="url(#cs-leaf2-grad)"
      />

      {/* --- RIGHT SIDE: EV CHARGING PLUG & CABLE --- */}
      {/* Cable attaching to circle */}
      <path
        d="M98 78C104 70 106 58 100 50"
        stroke="url(#cs-ring-grad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Plug handle body pointing inward */}
      <path
        d="M93 52L101 44C102.5 42.5 105 42.5 106.5 44L109 46.5C110.5 48 110.5 50.5 109 52L101 60C99.5 61.5 97 61.5 95.5 60L93 57.5C91.5 56 91.5 53.5 93 52Z"
        fill="url(#cs-plug-grad)"
        filter="drop-shadow(0 0 6px rgba(74, 222, 128, 0.7))"
      />
      {/* Plug connector nozzle tip */}
      <rect
        x="87"
        y="55"
        width="6"
        height="8"
        rx="2"
        transform="rotate(-45 87 55)"
        fill="#ffffff"
      />
      {/* Plug handle grip slot */}
      <ellipse
        cx="102"
        cy="51"
        rx="2.5"
        ry="4"
        transform="rotate(-45 102 51)"
        fill="#04200c"
      />
    </svg>
  );

  if (layout === 'icon-only') {
    return (
      <div className={`chargesphere-logo-icon ${className}`} style={style}>
        {iconSvg}
      </div>
    );
  }

  return (
    <div
      className={`chargesphere-brand-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'center' : 'center',
        textAlign: isVertical ? 'center' : 'left',
        gap: dimensions.gap,
        ...style
      }}
    >
      {iconSvg}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'center' : 'flex-start' }}>
        {/* Brand Name */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            fontWeight: 900,
            fontSize: dimensions.fontSize,
            lineHeight: 1.1,
            letterSpacing: '-0.4px',
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
          }}
        >
          <span style={{ color: '#ffffff', fontWeight: 800 }}>Charge</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #86efac 0%, #4ade80 40%, #22c55e 75%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.45))'
            }}
          >
            Sphere
          </span>
          <sup
            style={{
              fontSize: dimensions.tmSize,
              fontWeight: 700,
              color: '#9ca3af',
              marginLeft: 2,
              WebkitTextFillColor: '#9ca3af',
              verticalAlign: 'super'
            }}
          >
            ™
          </sup>
        </div>

        {/* Sub-tagline */}
        {showTagline && (
          <div
            style={{
              fontSize: dimensions.taglineSize,
              fontWeight: 600,
              letterSpacing: isVertical ? '1.8px' : '0.8px',
              textTransform: 'uppercase',
              color: '#86efac',
              opacity: 0.85,
              marginTop: isVertical ? 6 : 3,
              whiteSpace: 'nowrap',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            }}
          >
            Clean Mobility&nbsp;&nbsp;•&nbsp;&nbsp;Smarter Grids&nbsp;&nbsp;•&nbsp;&nbsp;Brighter Tomorrow
          </div>
        )}
      </div>
    </div>
  );
}
