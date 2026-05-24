interface LogoProps {
  className?: string
  iconSize?: number
  showText?: boolean
  usePng?: boolean
}

export function Logo({
  className = "",
  iconSize = 40,
  showText = true,
  usePng = false,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Hand-molded Clay Map Icon */}
      {usePng ? (
        <img
          src="/logo.png"
          style={{ width: iconSize, height: iconSize }}
          className="shrink-0 object-contain drop-shadow"
          alt="Clayground Logo"
        />
      ) : (
        <svg
          style={{ width: iconSize, height: iconSize }}
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-md"
        >
          <defs>
            <filter
              id="logo-clay-shadow-deep"
              x="-20%"
              y="-15%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="16"
                stdDeviation="16"
                flood-color="#1F0B02"
                flood-opacity="0.25"
              />
            </filter>
            <filter
              id="logo-clay-shadow-mid"
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
            >
              <feDropShadow
                dx="0"
                dy="10"
                stdDeviation="8"
                flood-color="#3A1709"
                flood-opacity="0.2"
              />
            </filter>
            <filter
              id="logo-clay-shadow-soft"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feDropShadow
                dx="0"
                dy="6"
                stdDeviation="5"
                flood-color="#3A1709"
                flood-opacity="0.15"
              />
            </filter>
            <filter
              id="logo-pin-shadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="4"
                flood-color="#1A0D05"
                flood-opacity="0.3"
              />
            </filter>

            <linearGradient
              id="logo-clay-base"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#E2875E" />
              <stop offset="60%" stop-color="#CA6B41" />
              <stop offset="100%" stop-color="#A54B25" />
            </linearGradient>

            <linearGradient
              id="logo-clay-level-1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#EFA782" />
              <stop offset="100%" stop-color="#D57B52" />
            </linearGradient>

            <linearGradient
              id="logo-clay-level-2"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#F4C2A3" />
              <stop offset="100%" stop-color="#DE8E66" />
            </linearGradient>

            <linearGradient
              id="logo-clay-level-3"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#FCE1CD" />
              <stop offset="100%" stop-color="#E9AA84" />
            </linearGradient>

            <linearGradient
              id="logo-clay-water"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#80ABB3" />
              <stop offset="50%" stop-color="#55828B" />
              <stop offset="100%" stop-color="#35565C" />
            </linearGradient>

            <radialGradient id="logo-clay-pin-yellow" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#FFE38E" />
              <stop offset="40%" stop-color="#F4B23E" />
              <stop offset="100%" stop-color="#C27A0B" />
            </radialGradient>

            <radialGradient id="logo-clay-pin-teal" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#A9E2D9" />
              <stop offset="45%" stop-color="#4FA196" />
              <stop offset="100%" stop-color="#246057" />
            </radialGradient>

            <linearGradient
              id="logo-carve-dark"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#602B15" />
              <stop offset="100%" stop-color="#833C1F" />
            </linearGradient>
          </defs>

          {/* 1. Base Clay Block with 3D Depth */}
          <path
            d="M 115,58 Q 256,53 397,58 Q 472,128 467,272 Q 472,416 397,486 Q 256,491 115,486 Q 40,416 45,272 Q 40,128 115,58 Z"
            fill="#753018"
          />
          <path
            d="M 115,44 Q 256,39 397,44 Q 472,114 467,258 Q 472,402 397,472 Q 256,477 115,472 Q 40,402 45,258 Q 40,114 115,44 Z"
            fill="url(#logo-clay-base)"
            filter="url(#logo-clay-shadow-deep)"
          />

          {/* 2. Carved Blue Clay River */}
          <path
            d="M 45,200 C 130,195 180,240 210,290 C 240,340 180,410 240,445 C 270,462 310,440 330,474"
            fill="none"
            stroke="url(#logo-clay-water)"
            stroke-width="32"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#logo-clay-shadow-soft)"
          />
          <path
            d="M 50,200 C 130,195 180,240 210,290 C 240,340 180,410 240,445 C 265,460 300,443 325,472"
            fill="none"
            stroke="#A7CCD3"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.4"
          />

          {/* 3. Topographic Elevation Level 1 */}
          <path
            d="M 180,140 C 240,105 320,95 385,110 C 445,125 450,190 435,265 C 420,340 340,400 270,390 C 215,380 180,335 170,285 C 160,235 125,170 180,140 Z"
            fill="url(#logo-clay-level-1)"
            filter="url(#logo-clay-shadow-mid)"
          />

          {/* 4. Topographic Elevation Level 2 */}
          <path
            d="M 235,165 C 275,140 340,135 380,165 C 415,190 405,255 375,300 C 345,340 280,345 250,310 C 220,280 205,200 235,165 Z"
            fill="url(#logo-clay-level-2)"
            filter="url(#logo-clay-shadow-soft)"
          />

          {/* 5. Hand-pressed Peak Level 3 */}
          <path
            d="M 285,185 C 315,170 350,180 360,205 C 370,230 345,270 315,260 C 285,250 265,205 285,185 Z"
            fill="url(#logo-clay-level-3)"
            filter="url(#logo-clay-shadow-soft)"
          />

          {/* 6. Stylus Route Groove */}
          <path
            d="M 120,110 Q 230,120 250,205 T 390,340"
            fill="none"
            stroke="url(#logo-carve-dark)"
            stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray="1, 16"
          />
          <path
            d="M 120,110 Q 230,120 250,205 T 390,340"
            fill="none"
            stroke="#FFE9DF"
            stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="1, 16"
            opacity="0.3"
            transform="translate(1, 2)"
          />

          {/* 7. Sculpted Clay Markers */}
          <g transform="translate(250, 205)" filter="url(#logo-pin-shadow)">
            <path
              d="M 0,0 C -12,-12 -16,-24 -16,-32 C -16,-41 -8,-48 1,-48 C 10,-48 18,-41 18,-32 C 18,-24 14,-12 0,0 Z"
              fill="url(#logo-clay-pin-teal)"
            />
            <circle cx="1" cy="-32" r="5" fill="#FCE1CD" />
          </g>

          <g
            transform="translate(315, 260) scale(0.85)"
            filter="url(#logo-pin-shadow)"
          >
            <path
              d="M 0,0 C -12,-12 -16,-24 -16,-32 C -16,-41 -8,-48 1,-48 C 10,-48 18,-41 18,-32 C 18,-24 14,-12 0,0 Z"
              fill="url(#logo-clay-pin-yellow)"
            />
            <circle cx="1" cy="-32" r="5" fill="#FFEFE5" />
          </g>

          {/* Highlight sheen */}
          <path
            d="M 115,46 Q 256,41 397,46"
            fill="none"
            stroke="#FFF"
            stroke-width="5"
            stroke-linecap="round"
            opacity="0.25"
            filter="blur(2px)"
          />
        </svg>
      )}

      {/* Modern Typography Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-sans text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            Clayground
          </span>
          <span className="mt-1 font-sans text-[9px] font-bold tracking-[0.16em] text-neutral-500 uppercase dark:text-neutral-400">
            MAPPING PLAYGROUND
          </span>
        </div>
      )}
    </div>
  )
}
export default Logo
