import { useEffect } from 'react';
import { AMBIENCE, AudioManager } from './audio';
import { useProgress } from './engine/save';
import { useGameStore } from './store/useGameStore';
import { DebugOverlay, debugEnabled } from './ui/debug/DebugOverlay';
import { SummaryScreen } from './ui/screens/SummaryScreen';
import { TitleScreen } from './ui/screens/TitleScreen';
import { GameScreen } from './ui/views/GameScreen';

export function App() {
  const screen = useGameStore((s) => s.screen);
  const muted = useProgress((p) => p.muted);
  const view = useGameStore((s) => s.view);
  // Dining-room chatter plays during a shift: muffled at the pass, louder at the door. Mute persists.
  useEffect(
    () => AudioManager.ambience(screen !== 'playing' ? 0 : view === 'floor' ? AMBIENCE.door : AMBIENCE.pass),
    [screen, view],
  );
  useEffect(() => AudioManager.setMuted(muted), [muted]);
  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'playing' && <GameScreen />}
      {screen === 'summary' && <SummaryScreen />}
      {debugEnabled && <DebugOverlay />}
    </>
  );
}
