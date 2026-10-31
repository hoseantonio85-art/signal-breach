import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'
import './styles/global.css'
import './styles/parity.css'
import './components/MissionCard.css'
import './styles/card-layout.css'
import './ui/panHints'
import './ui/displayFontPreview'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
