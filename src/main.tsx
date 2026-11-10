import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { telemetry } from './services/telemetry'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

// Inicializar telemetría centralizada
telemetry.init({
  appId: 'axioma-vet',
  appVersion: '1.0.0'
});

// Auto-recarga transparente si el navegador intenta cargar un chunk viejo tras un nuevo despliegue
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Axioma] Nueva versión de la aplicación detectada. Actualizando interfaz...', event);
    // Recarga fresca directamente del servidor (simula hard-reload)
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>,
)
