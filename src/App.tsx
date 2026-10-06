import { useGameStore } from './store/useGameStore';
import { DebugOverlay, debugEnabled } from './ui/debug/DebugOverlay';
import { SummaryScreen } from './ui/screens/SummaryScreen';
import { TitleScreen } from './ui/screens/TitleScreen';
import { GameScreen } from './ui/views/GameScreen';

export function App() {
  const screen = useGameStore((s) => s.screen);
  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'playing' && <GameScreen />}
      {screen === 'summary' && <SummaryScreen />}
      {debugEnabled && <DebugOverlay />}
    </>
  );
}
