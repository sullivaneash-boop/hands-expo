import type { InterruptSource } from '../../data/schema';

/**
 * Grey-box person: CSS shapes only (D-057) until real art lands. Role reads from the outfit:
 * servers in black with a paper apron, the bar back in a phosphor vest, the manager in a tie.
 */
const SKIN = ['#e9c9a8', '#c99d77', '#a26f4a', '#6e4428', '#f1d6bd'];
const LOOKS: Record<
  InterruptSource,
  { body: string; accent: string; accentShape: 'apron' | 'vest' | 'tie' | 'jacket' }
> = {
  server: { body: '#2b2b2e', accent: '#f2efe6', accentShape: 'apron' },
  bar: { body: '#3a3f44', accent: '#8fd19e', accentShape: 'vest' },
  manager: { body: '#1a1a1a', accent: '#e8a33d', accentShape: 'tie' },
  kitchen: { body: '#f2efe6', accent: '#8fa39a', accentShape: 'jacket' },
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Figure({
  source,
  who,
  label,
  scale = 1,
  className = '',
}: {
  source: InterruptSource;
  who: string;
  label?: string;
  scale?: number;
  className?: string;
}) {
  const look = LOOKS[source];
  const skin = SKIN[hash(who) % SKIN.length];
  return (
    <div className={`flex flex-col items-center ${className}`} style={{ width: 72 * scale }} aria-hidden>
      <div className="relative" style={{ width: 34 * scale, height: 34 * scale }}>
        <div className="absolute inset-0 rounded-full" style={{ background: skin }} />
        {/* hair */}
        <div
          className="absolute inset-x-0 top-0 rounded-t-full"
          style={{ height: 13 * scale, background: hash(who) % 2 ? '#1a1a1a' : '#4a3426' }}
        />
      </div>
      <div
        className="relative -mt-0.5 overflow-hidden rounded-t-[24px]"
        style={{ width: 64 * scale, height: 82 * scale, background: look.body }}
      >
        {look.accentShape === 'apron' && (
          <div
            className="absolute inset-x-[18%] bottom-0 top-[42%] rounded-t-sm"
            style={{ background: look.accent }}
          />
        )}
        {look.accentShape === 'vest' && (
          <>
            <div
              className="absolute left-[14%] top-[10%] bottom-0 w-[24%]"
              style={{ background: look.accent }}
            />
            <div
              className="absolute right-[14%] top-[10%] bottom-0 w-[24%]"
              style={{ background: look.accent }}
            />
          </>
        )}
        {look.accentShape === 'tie' && (
          <div
            className="absolute left-1/2 top-[6%] h-[60%] w-[12%] -translate-x-1/2"
            style={{ background: look.accent }}
          />
        )}
        {look.accentShape === 'jacket' && (
          <div
            className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2"
            style={{ background: look.accent }}
          />
        )}
      </div>
      {label && (
        <div className="mt-1 bg-[var(--thermal-black)] px-1.5 text-[10px] tracking-widest text-[var(--ticket-paper)]">
          {label}
        </div>
      )}
    </div>
  );
}
