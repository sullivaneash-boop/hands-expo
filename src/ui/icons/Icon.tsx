/**
 * HANDS! icon set (D-072): simple SVG silhouettes, readable at 20–96 px. Each dish has a distinct
 * *shape*; colour is reinforcement only (STYLE: never colour alone). Keys come from data (menu/mods `icon`).
 */
import type { ReactElement } from 'react';

const C = {
  bun: '#d9a35b',
  bunDark: '#b07a35',
  meat: '#6b3a26',
  meatHi: '#8a4f33',
  fish: '#f08a5d',
  fishStripe: '#fbd2bd',
  bird: '#c98b4b',
  bone: '#f2efe6',
  leaf: '#7fb069',
  leafDark: '#4f7a3d',
  cream: '#f4efe2',
  red: '#d64b3c',
  yellow: '#f2c94c',
  fry: '#f2b84b',
  box: '#c8423b',
  potato: '#c9954c',
  green: '#5f9a4a',
  onion: '#e7d3e8',
  onionLine: '#a46ea8',
  pickle: '#6e8f3a',
  cheese: '#f2c14e',
  butter: '#f6e39a',
  steel: '#9aa1a6',
  ink: '#2b2b2e',
};

const ICONS: Record<string, () => ReactElement> = {
  burger: () => (
    <>
      <path d="M8 22c0-8 7-13 16-13s16 5 16 13z" fill={C.bun} />
      <rect x="7" y="23" width="34" height="5" rx="2" fill={C.leaf} />
      <rect x="6" y="27" width="36" height="6" rx="3" fill={C.meat} />
      <path d="M8 34h32c0 4-3 6-6 6H14c-3 0-6-2-6-6z" fill={C.bunDark} />
      <circle cx="18" cy="15" r="1" fill={C.cream} />
      <circle cx="26" cy="13" r="1" fill={C.cream} />
      <circle cx="31" cy="17" r="1" fill={C.cream} />
    </>
  ),
  steak: () => (
    <>
      <path d="M10 18c4-8 18-10 26-5 7 4 5 14-1 18-6 5-17 6-23 2-5-3-6-9-2-15z" fill={C.meat} />
      <path
        d="M16 18l14 12M21 15l14 12M13 23l11 9"
        stroke={C.meatHi}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M34 14c3 2 4 6 2 9" stroke={C.cream} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  salmon: () => (
    <>
      <path d="M6 30c3-10 13-16 26-15 7 1 10 4 10 8s-4 9-12 10c-10 2-20 2-24-3z" fill={C.fish} />
      <path
        d="M14 27c4-3 8-4 12-4M17 32c5-3 10-4 15-4M24 20c4-1 8 0 11 2"
        stroke={C.fishStripe}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  chicken: () => (
    <>
      <path d="M12 30c-4-9 3-20 14-19 9 1 13 10 9 17-3 6-11 9-17 7" fill={C.bird} />
      <path d="M17 33l-6 6" stroke={C.bone} strokeWidth="4" strokeLinecap="round" />
      <circle cx="9" cy="40" r="3" fill={C.bone} />
      <circle cx="12" cy="42" r="2.5" fill={C.bone} />
    </>
  ),
  salad: () => (
    <>
      <path d="M6 24h36c-1 10-8 16-18 16S7 34 6 24z" fill={C.steel} />
      <path d="M10 24c2-6 6-9 10-7 2-5 8-6 11-2 4-2 8 1 8 9z" fill={C.leaf} />
      <circle cx="17" cy="21" r="2.5" fill={C.red} />
      <circle cx="28" cy="19" r="2" fill={C.red} />
      <path d="M22 20l3-4" stroke={C.leafDark} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  burrata: () => (
    <>
      <ellipse cx="24" cy="36" rx="18" ry="5" fill={C.steel} opacity="0.5" />
      <circle cx="24" cy="25" r="11" fill={C.cream} />
      <path d="M20 22c3 3 6 3 9 0" stroke="#d8d0bd" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="33" r="3.5" fill={C.red} />
      <circle cx="39" cy="32" r="3.5" fill={C.red} />
      <path d="M33 14l5-3M35 17l5-1" stroke={C.leaf} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  calamari: () => (
    <>
      {[
        [15, 18],
        [31, 17],
        [22, 30],
        [35, 31],
        [11, 32],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="7" fill={C.bun} />
          <circle cx={x} cy={y} r="3.2" fill="var(--icon-bg, #1a1a1a)" />
        </g>
      ))}
    </>
  ),
  fries: () => (
    <>
      {[12, 17, 22, 27, 32, 36].map((x, i) => (
        <rect key={i} x={x - 2} y={6 + (i % 3) * 3} width="4" height="22" rx="1" fill={C.fry} />
      ))}
      <path d="M9 22h30l-4 20H13z" fill={C.box} />
      <path d="M17 30h14" stroke="#f2efe6" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  potato: () => (
    <>
      <path d="M8 30c0-6 5-9 10-8 4 1 6 5 4 9-2 5-14 6-14-1z" fill={C.potato} />
      <path d="M24 22c1-6 8-9 13-5 4 3 3 10-3 11-6 2-11-1-10-6z" fill={C.potato} />
      <path d="M22 36c2-5 9-6 13-3 3 3 1 8-5 8s-9-2-8-5z" fill={C.potato} />
      <circle cx="15" cy="29" r="1" fill={C.leafDark} />
      <circle cx="31" cy="22" r="1" fill={C.leafDark} />
    </>
  ),
  asparagus: () => (
    <>
      {[14, 20, 26, 32].map((x, i) => (
        <g key={i}>
          <rect x={x - 1.6} y="12" width="3.2" height="28" rx="1.6" fill={C.green} />
          <path d={`M${x - 3} 14l3-7 3 7z`} fill={C.leafDark} />
        </g>
      ))}
    </>
  ),
  broccoli: () => (
    <>
      <rect x="20" y="24" width="8" height="16" rx="3" fill={C.leaf} />
      <circle cx="16" cy="20" r="7" fill={C.green} />
      <circle cx="32" cy="20" r="7" fill={C.green} />
      <circle cx="24" cy="14" r="8" fill={C.leafDark} />
    </>
  ),
  onion: () => (
    <>
      <circle cx="24" cy="25" r="14" fill={C.onion} />
      <circle cx="24" cy="25" r="9.5" fill="none" stroke={C.onionLine} strokeWidth="2" />
      <circle cx="24" cy="25" r="5" fill="none" stroke={C.onionLine} strokeWidth="2" />
    </>
  ),
  pickle: () => (
    <>
      <ellipse cx="24" cy="25" rx="9" ry="16" fill={C.pickle} transform="rotate(30 24 25)" />
      {[
        [21, 18],
        [26, 24],
        [23, 31],
        [29, 19],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#c4d98a" />
      ))}
    </>
  ),
  cheese: () => (
    <>
      <path d="M7 32l26-18 8 6v14H7z" fill={C.cheese} />
      <circle cx="18" cy="28" r="2.5" fill="#d9a32e" />
      <circle cx="29" cy="25" r="2" fill="#d9a32e" />
      <circle cx="34" cy="31" r="1.6" fill="#d9a32e" />
    </>
  ),
  butter: () => (
    <>
      <path d="M8 22l12-7h20l-12 7z" fill="#fbefb8" />
      <path d="M8 22h20v12H8z" fill={C.butter} />
      <path d="M28 22l12-7v12l-12 7z" fill="#e6cf6f" />
    </>
  ),
  tomato: () => (
    <>
      <circle cx="24" cy="27" r="13" fill={C.red} />
      <path
        d="M24 14l-5 4h10zM24 14v-4"
        stroke={C.leafDark}
        strokeWidth="2.5"
        fill={C.leafDark}
        strokeLinecap="round"
      />
    </>
  ),
  ramekin: () => (
    <>
      <path d="M10 22h28l-3 16H13z" fill={C.cream} />
      <ellipse cx="24" cy="22" rx="14" ry="4" fill="#b8642f" />
      <path d="M14 30h20" stroke="#d8d0bd" strokeWidth="2" />
    </>
  ),
  lemon: () => (
    <>
      <path d="M8 30a16 16 0 0 1 32 0z" fill={C.yellow} />
      <path d="M11 30a13 13 0 0 1 26 0z" fill="#f8e58c" />
      <path d="M24 30V18M24 30l-8-9M24 30l8-9" stroke={C.yellow} strokeWidth="1.6" />
    </>
  ),
  shield: () => (
    <>
      <path d="M24 5l15 5v12c0 10-7 17-15 21C16 39 9 32 9 22V10z" fill={C.red} />
      <path
        d="M17 24l5 5 9-11"
        stroke="#fff"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  unknown: () => <circle cx="24" cy="24" r="12" fill={C.steel} />,
};

export const iconKeys = Object.keys(ICONS);

/** A dish/ingredient icon. `variant`: 'remove' crosses it out, 'add' adds a + badge. */
export function Icon({
  name,
  size = 32,
  variant,
  title,
  className = '',
}: {
  name: string;
  size?: number;
  variant?: 'remove' | 'add';
  title?: string;
  className?: string;
}) {
  const draw = ICONS[name] ?? ICONS.unknown;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g opacity={variant === 'remove' ? 0.55 : 1}>{draw?.()}</g>
      {variant === 'remove' && <path d="M8 8l32 32" stroke="#c8423b" strokeWidth="5" strokeLinecap="round" />}
      {variant === 'add' && (
        <g>
          <circle cx="39" cy="9" r="8" fill="#2b2b2e" stroke="#f2efe6" strokeWidth="2" />
          <path d="M39 5v8M35 9h8" stroke="#f2efe6" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

const TEMPS = ['rare', 'med_rare', 'medium', 'med_well', 'well_done'] as const;
const TEMP_LABEL = ['R', 'MR', 'M', 'MW', 'WD'];
const TEMP_FILL = ['#b8323a', '#c8563f', '#b36d4a', '#8a5a40', '#5a3a2a'];

/** Doneness as a 5-notch gauge + abbreviation (shape + text, not colour alone). */
export function TempGauge({ mod, size = 'md' }: { mod: string | null; size?: 'sm' | 'md' }) {
  const idx = mod ? TEMPS.indexOf(mod as (typeof TEMPS)[number]) : -1;
  const w = size === 'sm' ? 6 : 9;
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={idx >= 0 ? `temp ${TEMP_LABEL[idx]}` : 'no temp'}
    >
      <span className="inline-flex gap-[2px]">
        {TEMPS.map((_, i) => (
          <span
            key={i}
            style={{ width: w, height: w + 3, background: i === idx ? TEMP_FILL[i] : 'transparent' }}
            className={`rounded-[2px] border ${i === idx ? 'border-paper' : 'border-steel'}`}
          />
        ))}
      </span>
      <span className={`font-bold ${size === 'sm' ? 'text-[9px]' : 'text-xs'}`}>
        {idx >= 0 ? TEMP_LABEL[idx] : '—'}
      </span>
    </span>
  );
}
