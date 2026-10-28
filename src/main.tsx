import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

// Retire caches that previously stored private classroom files without account scope.
if ('caches' in window) void caches.keys().then(keys=>Promise.all(keys.filter(key=>/^(episode-opened-assets|own-english|teaching-stone|question-journal|appwrite-api)/.test(key)).map(key=>caches.delete(key))));
const updateSW = registerSW({
  onNeedRefresh() {
    const accepted = window.confirm(
      'A new version is available. Reload to update?'
    )
    if (accepted) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
