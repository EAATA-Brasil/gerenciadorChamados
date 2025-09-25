import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter, HashRouter } from 'react-router-dom'

// Detecta se está rodando pelo protocolo file:// (produção Electron)
const isElectronProd = window.location.protocol === 'file:'

// Usa HashRouter no Electron, BrowserRouter em dev
const Router = isElectronProd ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>
)
