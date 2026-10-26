import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.tsx';
import './ui/styles/tokens.css';
import './ui/styles/base.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

// flushSync makes the first render synchronous, so the marker below really
// means "the shell is on screen" (the Android smoke test waits for it).
flushSync(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
console.log('cosmic:ready');
