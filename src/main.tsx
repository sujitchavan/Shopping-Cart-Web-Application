import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { safeLocalStorage } from '@/shared/lib/safeStorage';
import { createAppStore } from '@/store/store';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const store = createAppStore({ storage: safeLocalStorage });

createRoot(container).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
