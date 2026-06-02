import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@/i18n'

console.log('[main] React:', typeof React, 'ReactDOM:', typeof ReactDOM, 'createRoot:', typeof ReactDOM?.createRoot)
const rootEl = document.getElementById('root')
console.log('[main] root element:', rootEl)
ReactDOM.createRoot(rootEl!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
