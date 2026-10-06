import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initAudio } from './audio';
import { engine } from './engine/runtime';
import { useGameStore } from './store/useGameStore';
import { debugEnabled } from './ui/debug/DebugOverlay';
import './index.css';

// Audio subscribes to sim events outside React; Howler unlocks on the first click ("Clock In").
initAudio();

// Debug builds expose the engine for console poking and automated playtests.
if (debugEnabled) Object.assign(window, { __hands: { engine, store: useGameStore } });

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
