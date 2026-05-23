import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import BadmintonScoresheet from './BadmintonScoresheet.jsx'

function Root() {
  const hash = window.location.hash;
  if (hash === '#/badminton') return <BadmintonScoresheet />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
