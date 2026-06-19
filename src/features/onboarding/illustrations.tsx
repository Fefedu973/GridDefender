"use client";

/* Animated SVG illustrations for the onboarding fil d'Ariane.
   Each fills its container; animations are driven by classes in globals.css. */

const C = {
  cyan: "#22d3ee",
  bright: "#7df9ff",
  green: "#34f5b0",
  amber: "#ffd447",
  red: "#ff2f5f",
  violet: "#a78bfa",
  muted: "#8aa1ab",
};

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 360 280" className="h-full w-full" role="img">
      {children}
    </svg>
  );
}

/* ---- Shared shape helpers (kept coherent across every illustration) ---- */

/** A clean lightning bolt centred on (cx, cy); s scales it. */
function boltPath(cx: number, cy: number, s = 1) {
  return `M${cx + 3 * s} ${cy - 17 * s} L${cx - 9 * s} ${cy + 3 * s} L${cx - s} ${cy + 3 * s} L${cx - 4 * s} ${cy + 17 * s} L${cx + 10 * s} ${cy - 5 * s} L${cx + s} ${cy - 5 * s} Z`;
}

/* A crisp shield-check crest using Lucide's geometry (body spans x 4..20,
   y ~2..22 in a 24-unit box). Placed via a transform on an INNER <g> so an
   `il-float` CSS transform on the outer <g> can't clobber the placement.
   `non-scaling-stroke` keeps the outline weight identical at every size. */
const SHIELD_D =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";
const SHIELD_CHECK_D = "m9 12 2 2 4-4";

function Shield({
  cx,
  ty,
  w,
  color,
  fill = "#06202a",
  withCheck = true,
  className,
  style,
}: {
  cx: number;
  ty: number;
  w: number;
  color: string;
  fill?: string;
  withCheck?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const s = w / 16;
  const placement = `translate(${cx - s * 12} ${ty - s * 2}) scale(${s})`;
  return (
    <g className={className} style={style}>
      <g transform={placement}>
        <path d={SHIELD_D} fill={fill} stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {withCheck && (
          <path d={SHIELD_CHECK_D} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </g>
  );
}

/* 1 — Contexte : VivaTech / Defend Intelligence / IA x énergie */
export function ContextIllustration() {
  const cx = 180;
  const cy = 162;
  return (
    <Frame>
      <text x="180" y="30" textAnchor="middle" fill={C.bright} fontFamily="Rajdhani" fontWeight="700" fontSize="15" letterSpacing="3">
        VIVATECH · HACKATHON
      </text>

      {/* Defend Intelligence badge (satellite — floats on its own) */}
      <Shield cx={180} ty={44} w={42} color={C.green} className="il-float" />

      {/* Central AI core — orbit + pulse + node share one centre and stay put,
          so the pulse ring can never drift off the node. */}
      <circle cx={cx} cy={cy} r="54" fill="none" stroke={C.cyan} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="4 7" className="il-spin" style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r="30" fill="none" stroke={C.cyan} strokeWidth="2" className="il-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r="30" fill="#05202b" stroke={C.cyan} strokeWidth="1.5" />
      <path d={boltPath(cx, cy, 1.05)} fill={C.amber} />

      {/* theme pills */}
      <g className="il-float" style={{ animationDelay: "0.3s" }}>
        <rect x="24" y="210" width="92" height="30" rx="15" fill="#06181f" stroke={C.bright} strokeWidth="1" />
        <text x="70" y="230" textAnchor="middle" fill={C.bright} fontFamily="Inter" fontWeight="600" fontSize="13">IA</text>
      </g>
      <g className="il-float" style={{ animationDelay: "0.9s" }}>
        <rect x="244" y="210" width="92" height="30" rx="15" fill="#06181f" stroke={C.green} strokeWidth="1" />
        <text x="290" y="230" textAnchor="middle" fill={C.green} fontFamily="Inter" fontWeight="600" fontSize="13">Énergie</text>
      </g>

      <text x="180" y="266" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">
        Énergie × Intelligence Artificielle
      </text>
    </Frame>
  );
}

/* 2 — L'enjeu : l'IA n'est pas le problème, c'est le pilotage */
export function StakeIllustration() {
  return (
    <Frame>
      {/* prompt bubble */}
      <g className="il-float">
        <rect x="34" y="96" width="118" height="74" rx="14" fill="#06202b" stroke={C.cyan} strokeWidth="1.4" />
        <path d="M64 170 l0 18 18 -18 z" fill="#06202b" stroke={C.cyan} strokeWidth="1.4" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={70 + i * 22} cy="133" r="6" fill={C.bright} className="il-blink" style={{ animationDelay: `${i * 0.25}s` }} />
        ))}
        <text x="93" y="88" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">Prompt IA</text>
      </g>

      {/* flowing arrow */}
      <line x1="158" y1="133" x2="214" y2="133" stroke={C.cyan} strokeWidth="2.5" className="il-dash" />
      <path d="M214 126 l12 7 -12 7 z" fill={C.cyan} />

      {/* energy bolt target */}
      <g className="il-float" style={{ animationDelay: "0.5s" }}>
        <circle cx="270" cy="133" r="40" fill="#05202b" stroke={C.amber} strokeWidth="1.5" />
        <circle cx="270" cy="133" r="40" fill="none" stroke={C.amber} strokeWidth="2" className="il-pulse" style={{ transformOrigin: "270px 133px" }} />
        <path d="M272 112 l-12 26 h10 l-5 18 20 -28 h-11 z" fill={C.amber} />
      </g>

      {/* quand / où / comment */}
      {["QUAND", "OÙ", "COMMENT"].map((label, i) => (
        <text
          key={label}
          x="180"
          y="222"
          textAnchor="middle"
          fill={C.green}
          fontFamily="Rajdhani"
          fontWeight="700"
          fontSize="22"
          letterSpacing="2"
          className="il-cycle3"
          style={{ animationDelay: `${i * 1.6}s` }}
        >
          {label} ?
        </text>
      ))}
      <text x="180" y="258" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">
        Une charge IA peut être décalée, allégée, mise en cache…
      </text>
    </Frame>
  );
}

/* 3 — Souveraineté : garder l'IA critique en local */
export function SovereigntyIllustration() {
  const sx = 116; // shield centre x
  const core = 120; // shield interior centre y
  return (
    <Frame>
      <text x="180" y="32" textAnchor="middle" fill={C.green} fontFamily="Rajdhani" fontWeight="700" fontSize="14" letterSpacing="2">
        CALCUL IA SOUVERAIN
      </text>

      {/* Sovereign shield (left) — protects the local compute */}
      <Shield cx={sx} ty={56} w={108} color={C.green} withCheck={false} className="il-float" />

      {/* secure data circulating inside the shield, centred on the lock */}
      <g className="il-spin" style={{ transformOrigin: `${sx}px ${core}px` }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return <circle key={i} cx={sx + Math.cos(a) * 29} cy={core + Math.sin(a) * 29} r="3.6" fill={C.bright} className="il-blink" style={{ animationDelay: `${i * 0.18}s` }} />;
        })}
      </g>

      {/* lock at the protected core */}
      <rect x={sx - 13} y={core - 4} width="26" height="22" rx="3.5" fill="#02141b" stroke={C.green} strokeWidth="1.8" />
      <path d={`M${sx - 9} ${core - 4} v-7 a9 9 0 0 1 18 0 v7`} fill="none" stroke={C.green} strokeWidth="1.8" />
      <circle cx={sx} cy={core + 6} r="2.6" fill={C.green} />

      <text x={sx} y="206" textAnchor="middle" fill={C.green} fontFamily="Inter" fontWeight="600" fontSize="12">Datacenter souverain</text>

      {/* foreign cloud (top-right), refused */}
      <g className="il-float" style={{ animationDelay: "0.5s" }}>
        <path d="M268 78 a15 15 0 0 1 29 4 a13 13 0 0 1 -3 25 h-27 a14 14 0 0 1 1 -29 z" fill="#1a0f14" stroke={C.red} strokeWidth="1.5" />
      </g>
      <text x="287" y="128" textAnchor="middle" fill={C.red} fontFamily="Inter" fontSize="11">cloud étranger</text>

      {/* blocked link: dashed line + no-entry sign in the middle */}
      <line x1="172" y1="126" x2="252" y2="100" stroke={C.red} strokeWidth="2" strokeDasharray="5 6" strokeOpacity="0.85" />
      <g style={{ transformOrigin: "212px 113px" }}>
        <circle cx="212" cy="113" r="13" fill="#0c0306" stroke={C.red} strokeWidth="2.6" />
        <line x1="203.8" y1="121.2" x2="220.2" y2="104.8" stroke={C.red} strokeWidth="2.6" strokeLinecap="round" />
      </g>

      <text x="180" y="252" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">
        Les calculs IA critiques restent traités en France
      </text>
    </Frame>
  );
}

/* 4 — Décarbonation : le mix et le timing comptent */
export function DecarbonationIllustration() {
  return (
    <Frame>
      {/* sun (left) */}
      <g style={{ transformOrigin: "70px 74px" }} className="il-spin">
        <circle cx="70" cy="74" r="15" fill="none" stroke={C.amber} strokeWidth="2" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={70 + Math.cos(a) * 21} y1={74 + Math.sin(a) * 21} x2={70 + Math.cos(a) * 29} y2={74 + Math.sin(a) * 29} stroke={C.amber} strokeWidth="2" strokeLinecap="round" />;
        })}
      </g>
      <circle cx="70" cy="74" r="10" fill={C.amber} />

      {/* wind turbine (centre): mast + spinning rotor */}
      <line x1="180" y1="118" x2="180" y2="66" stroke={C.bright} strokeWidth="3" strokeLinecap="round" />
      <g style={{ transformOrigin: "180px 66px" }} className="il-spin-fast">
        <line x1="180" y1="66" x2="180" y2="36" stroke={C.bright} strokeWidth="4" strokeLinecap="round" />
        <line x1="180" y1="66" x2="206" y2="81" stroke={C.bright} strokeWidth="4" strokeLinecap="round" />
        <line x1="180" y1="66" x2="154" y2="81" stroke={C.bright} strokeWidth="4" strokeLinecap="round" />
        <circle cx="180" cy="66" r="3.5" fill={C.bright} />
      </g>

      {/* cooling tower (right): proper hyperboloid silhouette + steam */}
      <path d="M272 118 Q278 92 276 78 L288 78 Q286 92 292 118 Z" fill="#06202a" stroke={C.green} strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="282" cy="78" rx="6.4" ry="2.4" fill="none" stroke={C.green} strokeWidth="1.4" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={282 + (i - 1) * 3} cy={70 - i * 7} r={3.4 - i * 0.5} fill={C.green} className="il-blink" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}

      {/* clean energy flowing down to the gauge — stops above the arc */}
      <path
        d="M78 90 Q120 126 166 138 M180 122 L180 140 M282 92 Q244 126 194 138"
        fill="none"
        stroke={C.cyan}
        strokeWidth="2"
        strokeLinecap="round"
        className="il-dash"
      />

      {/* CO2 gauge dropping */}
      <path d="M120 208 a60 60 0 0 1 120 0" fill="none" stroke="#13323b" strokeWidth="10" strokeLinecap="round" />
      <path d="M120 208 a60 60 0 0 1 120 0" fill="none" stroke={C.green} strokeWidth="10" strokeLinecap="round" strokeDasharray="118 200" />
      <line x1="180" y1="208" x2="180" y2="158" stroke={C.green} strokeWidth="3" strokeLinecap="round" className="il-co2" style={{ transformOrigin: "180px 208px" }} />
      <circle cx="180" cy="208" r="6" fill={C.green} />
      <text x="180" y="244" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">CO₂ ↓ selon le mix et l’heure</text>
    </Frame>
  );
}

/* 5 — Énergie française décarbonée ET compétitive */
export function CompetitivenessIllustration() {
  const bars = [
    { label: "Nucléaire", h: 130, color: C.green },
    { label: "Renouv.", h: 86, color: C.amber },
    { label: "Hydro", h: 64, color: C.bright },
    { label: "Batterie", h: 48, color: C.violet },
  ];
  return (
    <Frame>
      <line x1="44" y1="200" x2="316" y2="200" stroke={C.muted} strokeOpacity="0.4" strokeWidth="1.5" />
      {bars.map((b, i) => {
        const x = 60 + i * 70;
        return (
          <g key={b.label}>
            <rect x={x} y={200 - b.h} width="40" height={b.h} rx="5" fill={b.color} fillOpacity="0.85" className="il-rise" style={{ animationDelay: `${i * 0.18}s`, transformOrigin: `${x + 20}px 200px` }} />
            <text x={x + 20} y="218" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="11">{b.label}</text>
          </g>
        );
      })}
      <g className="il-float">
        <rect x="40" y="36" width="118" height="30" rx="15" fill="#06202a" stroke={C.green} strokeWidth="1" />
        <text x="99" y="56" textAnchor="middle" fill={C.green} fontFamily="Inter" fontWeight="600" fontSize="12">Bas carbone</text>
      </g>
      <g className="il-float" style={{ animationDelay: "0.5s" }}>
        <rect x="202" y="36" width="118" height="30" rx="15" fill="#06202a" stroke={C.amber} strokeWidth="1" />
        <text x="261" y="56" textAnchor="middle" fill={C.amber} fontFamily="Inter" fontWeight="600" fontSize="12">€ compétitif</text>
      </g>
      <text x="180" y="250" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">Un socle stable à équilibrer en permanence</text>
    </Frame>
  );
}

/* 6 — Comment on joue : équilibrer offre/demande + agir */
export function HowToPlayIllustration() {
  return (
    <Frame>
      {/* gauge arc */}
      <path d="M70 180 a110 110 0 0 1 220 0" fill="none" stroke="#13323b" strokeWidth="12" strokeLinecap="round" />
      <path d="M70 180 a110 110 0 0 1 73 -104" fill="none" stroke={C.red} strokeWidth="12" strokeLinecap="round" />
      <path d="M217 76 a110 110 0 0 1 73 104" fill="none" stroke={C.green} strokeWidth="12" strokeLinecap="round" />
      {/* needle oscillating */}
      <line x1="180" y1="180" x2="180" y2="92" stroke={C.bright} strokeWidth="4" strokeLinecap="round" className="il-needle" style={{ transformOrigin: "180px 180px" }} />
      <circle cx="180" cy="180" r="8" fill={C.bright} />
      <text x="74" y="206" fill={C.amber} fontFamily="Rajdhani" fontWeight="700" fontSize="13">DEMANDE</text>
      <text x="246" y="206" fill={C.green} fontFamily="Rajdhani" fontWeight="700" fontSize="13">PROD</text>

      {/* action chips */}
      {[
        { x: 70, label: "⏱ Décaler" },
        { x: 152, label: "⚡ Batterie" },
        { x: 240, label: "▣ Cache" },
      ].map((a, i) => (
        <g key={a.label} className="il-float" style={{ animationDelay: `${i * 0.3}s` }}>
          <rect x={a.x} y="232" width="78" height="26" rx="13" fill="#06181f" stroke={C.cyan} strokeWidth="1" />
          <text x={a.x + 39} y="249" textAnchor="middle" fill={C.bright} fontFamily="Inter" fontSize="11">{a.label}</text>
        </g>
      ))}
    </Frame>
  );
}

/* 7 — La mission : passer le pic du soir */
export function MissionIllustration() {
  const peakX = 198;
  const peakY = 76;
  // Smooth bell with horizontal tangents at the apex, so the peak marker can
  // sit exactly on (peakX, peakY) instead of floating off the curve.
  const curve = `M44 184 C 122 180 168 ${peakY} ${peakX} ${peakY} C ${peakX + 30} ${peakY} 278 180 320 176`;
  return (
    <Frame>
      <line x1="44" y1="210" x2="324" y2="210" stroke={C.muted} strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="44" y1="44" x2="44" y2="210" stroke={C.muted} strokeOpacity="0.4" strokeWidth="1.5" />

      {/* soft area + demand curve drawing in */}
      <path d={`${curve} L320 210 L44 210 Z`} fill={C.amber} fillOpacity="0.08" />
      <path d={curve} fill="none" stroke={C.amber} strokeWidth="3" strokeLinecap="round" className="il-draw" />

      {/* peak marker — pinned to the apex, only the ring pulses */}
      <text x={peakX} y="50" textAnchor="middle" fill={C.red} fontFamily="Rajdhani" fontWeight="700" fontSize="14" letterSpacing="1">PIC 19h</text>
      <circle cx={peakX} cy={peakY} r="9" fill="none" stroke={C.red} strokeWidth="2" className="il-pulse" style={{ transformOrigin: `${peakX}px ${peakY}px` }} />
      <circle cx={peakX} cy={peakY} r="6.5" fill="#1a0f14" stroke={C.red} strokeWidth="2" />

      {/* shield holding the evening line on the descent */}
      <Shield cx={298} ty={150} w={36} color={C.green} className="il-float" style={{ animationDelay: "0.4s" }} />

      <text x="44" y="232" fill={C.muted} fontFamily="JetBrains Mono" fontSize="12">17:30</text>
      <text x="320" y="232" textAnchor="end" fill={C.muted} fontFamily="JetBrains Mono" fontSize="12">20:30</text>
      <text x="180" y="262" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">Traverser le pic du soir sans blackout</text>
    </Frame>
  );
}
