import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ScannerProvider } from './context/ScannerContext';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <ScannerProvider>
    <StrictMode>
      <App />
    </StrictMode>,
  </ScannerProvider>
)
