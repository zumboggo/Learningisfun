import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

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
