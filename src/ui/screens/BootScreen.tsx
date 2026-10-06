import { useGameStore } from '../../store/useGameStore';

/** Phase 1 proof-of-life: the loop runs and the mirror updates. Each counter subscribes narrowly. */
function TickCounter() {
  const tick = useGameStore((s) => s.snap?.tick ?? 0);
  return <Row label="SIM TICK" value={tick.toString()} />;
}

function SimClock() {
  const nowMs = useGameStore((s) => s.snap?.nowMs ?? 0);
  return <Row label="SIM TIME" value={`${(nowMs / 1000).toFixed(2)} s`} />;
}

function Fps() {
  const fps = useGameStore((s) => s.fps);
  return <Row label="RENDER FPS" value={fps.toString()} />;
}

function Seed() {
  const seed = useGameStore((s) => s.snap?.seed);
  return <Row label="SEED" value={seed?.toString() ?? '—'} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-8">
      <span className="text-tile">{label}</span>
      <span className="text-phosphor tabular-nums">{value}</span>
    </div>
  );
}

export function BootScreen() {
  return (
    <main className="flex h-full items-center justify-center p-4">
      <section className="w-full max-w-sm border border-steel bg-night p-6">
        <h1 className="mb-1 text-2xl font-bold tracking-widest text-amber">HANDS!</h1>
        <p className="mb-6 text-xs text-tile">scaffold · phase 1</p>
        <div className="space-y-2 text-sm">
          <TickCounter />
          <SimClock />
          <Fps />
          <Seed />
        </div>
      </section>
    </main>
  );
}
