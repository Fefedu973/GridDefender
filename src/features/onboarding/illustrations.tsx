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

/* 1 — Contexte : VivaTech / Defend Intelligence / OpenAI × Engie */
export function ContextIllustration() {
  return (
    <Frame>
      <text x="180" y="34" textAnchor="middle" fill={C.bright} fontFamily="Rajdhani" fontWeight="700" fontSize="15" letterSpacing="3">
        VIVATECH · HACKATHON
      </text>

      {/* orbit ring */}
      <circle cx="180" cy="150" r="78" fill="none" stroke={C.cyan} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="4 7" className="il-spin" style={{ transformOrigin: "180px 150px" }} />
      {/* pulse rings */}
      <circle cx="180" cy="150" r="34" fill="none" stroke={C.cyan} strokeWidth="2" className="il-pulse" style={{ transformOrigin: "180px 150px" }} />

      {/* central node: brain + bolt */}
      <g className="il-float">
        <circle cx="180" cy="150" r="34" fill="#05202b" stroke={C.cyan} strokeWidth="1.5" />
        <path d="M180 134 l-9 20 h8 l-4 14 16 -22 h-9 z" fill={C.amber} />
      </g>

      {/* Defend Intelligence shield */}
      <g className="il-float" style={{ animationDelay: "0.6s" }}>
        <path d="M180 96 l20 7 v10 c0 12 -9 19 -20 23 c-11 -4 -20 -11 -20 -23 v-10 z" fill="#06202a" stroke={C.green} strokeWidth="1.4" />
        <path d="M172 110 l6 6 11 -11" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* partner pills */}
      <g className="il-float" style={{ animationDelay: "0.3s" }}>
        <rect x="36" y="186" width="92" height="30" rx="15" fill="#06181f" stroke={C.bright} strokeWidth="1" />
        <text x="82" y="206" textAnchor="middle" fill={C.bright} fontFamily="Inter" fontWeight="600" fontSize="13">OpenAI</text>
      </g>
      <g className="il-float" style={{ animationDelay: "0.9s" }}>
        <rect x="232" y="186" width="92" height="30" rx="15" fill="#06181f" stroke={C.green} strokeWidth="1" />
        <text x="278" y="206" textAnchor="middle" fill={C.green} fontFamily="Inter" fontWeight="600" fontSize="13">Engie</text>
      </g>

      <text x="180" y="262" textAnchor="middle" fill={C.muted} fontFamily="Inter" fontSize="12">
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
  return (
    <Frame>
      {/* France-ish shield */}
      <g className="il-float">
        <path d="M150 70 l46 14 v44 c0 30 -22 48 -46 58 c-24 -10 -46 -28 -46 -58 v-44 z" fill="#06202a" stroke={C.green} strokeWidth="1.6" />
        {/* circulating data dots inside */}
        <g className="il-spin" style={{ transformOrigin: "150px 140px" }}>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2;
            return <circle key={i} cx={150 + Math.cos(a) * 30} cy={140 + Math.sin(a) * 30} r="5" fill={C.bright} />;
          })}
        </g>
        {/* lock */}
        <rect x="138" y="138" width="24" height="20" rx="3" fill="#02141b" stroke={C.green} strokeWidth="1.6" />
        <path d="M142 138 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke={C.green} strokeWidth="1.6" />
      </g>

      {/* external cloud, blocked */}
      <g className="il-float" style={{ animationDelay: "0.5s" }}>
        <path d="M256 86 a16 16 0 0 1 31 4 a14 14 0 0 1 -3 28 h-30 a15 15 0 0 1 2 -32 z" fill="#1a0f14" stroke={C.red} strokeWidth="1.4" />
        <text x="272" y="118" textAnchor="middle" fill={C.red} fontFamily="Inter" fontSize="10">cloud étranger</text>
      </g>
      <line x1="210" y1="120" x2="250" y2="108" stroke={C.red} strokeWidth="2.2" strokeDasharray="5 5" />
      <line x1="222" y1="100" x2="238" y2="126" stroke={C.red} strokeWidth="2.4" strokeLinecap="round" />

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
      {/* sun */}
      <g style={{ transformOrigin: "70px 80px" }} className="il-spin">
        <circle cx="70" cy="80" r="16" fill="none" stroke={C.amber} strokeWidth="2" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={70 + Math.cos(a) * 22} y1={80 + Math.sin(a) * 22} x2={70 + Math.cos(a) * 30} y2={80 + Math.sin(a) * 30} stroke={C.amber} strokeWidth="2" strokeLinecap="round" />;
        })}
      </g>
      <circle cx="70" cy="80" r="11" fill={C.amber} />

      {/* wind turbine: mast + a single pre-arranged rotor group that spins */}
      <line x1="150" y1="120" x2="150" y2="70" stroke={C.bright} strokeWidth="3" />
      <g style={{ transformOrigin: "150px 70px" }} className="il-spin-fast">
        <line x1="150" y1="70" x2="150" y2="40" stroke={C.bright} strokeWidth="4" strokeLinecap="round" />
        <line x1="150" y1="70" x2="176" y2="85" stroke={C.bright} strokeWidth="4" strokeLinecap="round" />
        <line x1="150" y1="70" x2="124" y2="85" stroke={C.bright} strokeWidth="4" strokeLinecap="round" />
        <circle cx="150" cy="70" r="3.5" fill={C.bright} />
      </g>

      {/* nuclear */}
      <path d="M210 120 l6 -44 h14 l6 44 z" fill="#06202a" stroke={C.green} strokeWidth="1.6" />
      <ellipse cx="223" cy="74" rx="11" ry="4" fill={C.green} className="il-blink" />

      {/* flow to CO2 gauge */}
      <path d="M70 100 q60 60 110 70 M150 124 q15 30 30 46 M223 124 q-8 24 -23 46" fill="none" stroke={C.cyan} strokeWidth="2" className="il-dash" />

      {/* CO2 gauge dropping */}
      <path d="M120 210 a60 60 0 0 1 120 0" fill="none" stroke="#13323b" strokeWidth="10" strokeLinecap="round" />
      <path d="M120 210 a60 60 0 0 1 120 0" fill="none" stroke={C.green} strokeWidth="10" strokeLinecap="round" strokeDasharray="120 200" />
      <line x1="180" y1="210" x2="180" y2="160" stroke={C.green} strokeWidth="3" strokeLinecap="round" className="il-co2" style={{ transformOrigin: "180px 210px" }} />
      <circle cx="180" cy="210" r="6" fill={C.green} />
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
  return (
    <Frame>
      <line x1="40" y1="206" x2="320" y2="206" stroke={C.muted} strokeOpacity="0.4" strokeWidth="1.5" />
      <line x1="40" y1="50" x2="40" y2="206" stroke={C.muted} strokeOpacity="0.4" strokeWidth="1.5" />
      {/* demand curve rising to an evening peak */}
      <path d="M40 168 C 110 160 150 150 196 96 C 220 70 240 70 264 110 C 286 150 300 158 320 156" fill="none" stroke={C.amber} strokeWidth="3" className="il-draw" />
      {/* peak marker */}
      <g className="il-float">
        <circle cx="210" cy="80" r="9" fill="#1a0f14" stroke={C.red} strokeWidth="2" />
        <circle cx="210" cy="80" r="9" fill="none" stroke={C.red} strokeWidth="2" className="il-pulse" style={{ transformOrigin: "210px 80px" }} />
        <text x="210" y="58" textAnchor="middle" fill={C.red} fontFamily="Rajdhani" fontWeight="700" fontSize="13">PIC 19h</text>
      </g>
      {/* shield holding the line */}
      <g className="il-float" style={{ animationDelay: "0.5s" }}>
        <path d="M286 150 l18 6 v10 c0 11 -8 17 -18 21 c-10 -4 -18 -10 -18 -21 v-10 z" fill="#06202a" stroke={C.green} strokeWidth="1.5" />
        <path d="M279 166 l5 5 9 -9" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
      </g>
      <text x="48" y="234" fill={C.muted} fontFamily="JetBrains Mono" fontSize="12">17:30</text>
      <text x="288" y="234" fill={C.muted} fontFamily="JetBrains Mono" fontSize="12">20:30</text>
    </Frame>
  );
}
