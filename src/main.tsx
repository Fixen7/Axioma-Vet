import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Limpieza temporal de cookies host-only antiguas (zombies) de Axioma Vet
if (typeof document !== 'undefined') {
  document.cookie.split(';').forEach((c) => {
    const cookieName = c.split('=')[0].trim();
    if (cookieName.startsWith('sb-') && cookieName.includes('-auth-token')) {
      // Al NO incluir 'domain', el navegador SOLO elimina la cookie host-only si existe.
      // Las cookies compartidas (.axiomadynamics.com) no se ven afectadas porque requieren el domain explicito para borrarse.
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
