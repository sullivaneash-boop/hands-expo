import { useEffect } from 'react';
import { AudioManager } from './audio';
import { useProgress } from './engine/save';
import { useGameStore } from './store/useGameStore';
import { DebugOverlay, debugEnabled } from './ui/debug/DebugOverlay';
import { SummaryScreen } from './ui/screens/SummaryScreen';
import { TitleScreen } from './ui/screens/TitleScreen';
import { GameScreen } from './ui/views/GameScreen';

export function App() {
  const screen = useGameStore((s) => s.screen);
  const muted = useProgress((p) => p.muted);
  // The kitchen bed plays while a shift is on screen; mute persists across visits.
  useEffect(() => AudioManager.ambience(screen === 'playing'), [screen]);
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
